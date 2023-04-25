/** @module url-frontier
 *
 * Resources:
 * https://www.youtube.com/watch?v=BKZxZwUgL3Y
 * https://nlp.stanford.edu/IR-book/html/htmledition/the-url-frontier-1.html
 * https://nlp.stanford.edu/IR-book/
 */
import { AsyncMap } from "../utils/AsyncMap";
import { AsyncQueue } from "../utils/AsyncQueue";
import { naiveRoundRobinSelector } from "./FrontQueueSelectors";
import { HostHeap } from "./HostHeap";
import { politeByHost } from "./BackQueueRouter";
import { naiveRoundRobinPrioritizer } from "./Prioritizer";
import { backQueueSelector } from "./BackQueueSelector";
import { URL } from "url";

/** A URL */
export type Link = string;

export async function index(text: string) {
	return text;
}

/** The host Cache */

/** Links come to the front queue first...they are ordered by priority and are enqueued from the prioritizer into this
 * frontQueue. The frontQueue is a list of queues numbered 1 -> F who help with prioritization of the links.
 * Links are added to smaller numbers (1 being the smallest) to signify they should take priority
 * over other links in higher numbered queues (with F being the highest).
 *
 * Note that there should only ever be one frontQueue (meaning one list of queues). So if you want to distribute your work load across multiple queues you should
 * tie the frontQueue to a cache such as redis.
 *
 * Default priorities:
 * [
 *  1st position: seed list,
 *  2nd position: updated in last 2 weeks.
 *  never: updated more than two weeks ago.
 * ]
 *
 * Note: we put this description on the FrontQueue type so that it's description will be wherever it is used.
 * */
export type FrontQueue = AsyncQueue<Link>[];
/** Links go from the front queue and are enqueued into the back queue using a backQueue router. Each backQueue is nonempty and only
 * one is allowed per host and each queue gets it's own async "thread" (concurrency is what we'll use for the moment instead of
 * parallelization [although concurrency can actually enable parallelization]).
 * This back queue is dequeued from the fetcher. */
export type BackQueue = Map<Host, AsyncQueue<Link>>;

/** The Host of a URL */
export type Host = string;
/** Tells the time of the last call for an item given the host. */
export type HostTimeOfLastCallHeap = AsyncMap<Host, number>;

export type URLFrontierSettings = {
	/** This function sends a url from outside the URL Frontier into the frontQueue.
	 * This function will tell how a url should be prioritized over others. It should return a number between 1 and F, if it returns undefined the item will be dropped and not be added to the front queue,
	 * Whatever number is returned will be clamped between the values of 1 and F. */
	frontQueuePrioritizer(context: {
		url: Link;
		frontQueue: FrontQueue;
	}): Promise<FrontQueue[number]>;
	/** This tells which should be the next URL that comes from the front queue.
	 * It MUST NOT handle dequeueing from one of the FrontQueues and returning a URL.
	 */
	biasedFrontQueueSelector(context: {
		frontQueue: FrontQueue;
	}): Promise<FrontQueue[number]>;
	/** The number of different priorities allowed in the queue */
	F: number;
	/** The number of different backqueues allowed usually the same as the number of hosts. */
	B: number;
	/** This function is used to assign an item to a backQueue with Politeness guarantees.
	 * Should return a member of the backqueue.
	 * It MUST NOT handle enqueueing or dequeueing into one of the BackQueues */
	backqueueRouter(context: {
		backQueue: BackQueue;
		host: Host;
	}): Promise<ReturnType<BackQueue["get"]>>;
	/** This function gets something from the back queue */
	backqueueSelector(context: {
		backQueue: BackQueue;
		hostHeap: HostHeap;
		backQueueRouter: URLFrontierSettings["backqueueRouter"];
	}): Promise<Link | undefined>;
};

export const defaultURLFrontierSettings: URLFrontierSettings = {
	frontQueuePrioritizer: naiveRoundRobinPrioritizer,
	biasedFrontQueueSelector: naiveRoundRobinSelector(),
	F: 1,
	B: 1000,
	backqueueRouter: politeByHost,
	backqueueSelector: backQueueSelector,
} as const;

export class URLFrontier {
	#backQueue: BackQueue = new Map();
	#frontQueue: FrontQueue = [];
	settings: URLFrontierSettings = defaultURLFrontierSettings;
	#awaitURLs = new AsyncMap<Link, Link>();
	#hostHeap = new HostHeap();
	#incomingURLs = new AsyncQueue<Link>();
	#stopped = false;
	#frontierLinks = new Map<Link, Promise<Link>>();

	constructor(settings: Partial<URLFrontierSettings> = {}) {
		this.settings = {
			...defaultURLFrontierSettings,
			...settings,
		};
		this.#frontQueue = new Array(settings.F)
			.fill(0)
			.map((x) => new AsyncQueue());
		this.#backQueue = new Map();
	}

	async prioritize(url: Link): Promise<Link> {
		const frontQueue = await this.settings.frontQueuePrioritizer({
			url,
			frontQueue: this.#frontQueue,
		});
		await frontQueue.enqueue(url);
		return url;
	}

	async seedURL(url: Link) {
		const _url = new URL(url).href;
		let result!: Promise<{
			url: string;
			cached: boolean;
		}>;
		let temp = this.#frontierLinks.get(_url);
		if (temp) {
			result = temp.then((url) => ({
				url,
				cached: true,
			}));
		} else {
			const temp = this._seedURL(_url);
			result = temp.then((url) => ({
				url,
				cached: false,
			}));
			this.#frontierLinks.set(_url, temp).get(_url);
		}
		return result;
	}

	async sendURL(url: Link) {
		const result = this.seedURL(url);
		await Promise.race([result, this.runToCompletion()]);
		return result;
	}

	private async _seedURL(url: Link) {
		const result = this.#awaitURLs.take(new URL(url).href);
		this.#incomingURLs.enqueue(url);
		return result;
	}

	stop() {
		this.#stopped = true;
	}

	async runToCompletion() {
		for await (const url of this) {
		}
		return;
	}

	async *[Symbol.asyncIterator]() {
		this.#stopped = false;
		this.prioritizingFrontQueueAdder();
		this.addToBackQueueFromFrontQueue();
		yield* this.backQueueSelection();
	}

	async prioritizingFrontQueueAdder() {
		for await (const url of this.#incomingURLs) {
			if (this.#stopped) return;
			if (url) {
				this.prioritize(url);
			}
		}
	}

	async addToBackQueueFromFrontQueue() {
		while (true) {
			if (this.#stopped) return;
			const frontQueue = await this.settings.biasedFrontQueueSelector({
				frontQueue: this.#frontQueue,
			});
			const url = new URL(await frontQueue.dequeue());
			this.#hostHeap.insertHost(url.host);
			(
				await this.settings.backqueueRouter({
					host: url.host,
					backQueue: this.#backQueue,
				})
			)?.enqueue(url.href);
		}
	}

	async *backQueueSelection() {
		while (true) {
			if (this.#stopped) return;
			const url: Link | undefined = await this.settings.backqueueSelector({
				backQueue: this.#backQueue,
				backQueueRouter: this.settings.backqueueRouter,
				hostHeap: this.#hostHeap,
			});
			if (!url) return;
			this.#awaitURLs.put(url, url);
			yield url;
		}
	}
}
