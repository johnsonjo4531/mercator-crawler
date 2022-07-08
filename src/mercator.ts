/** This is not as of yet a full mercator crawler.
 */

import { scrapeMeta } from "./metadata-fetcher";
import { Link, URLFrontier } from "./url-frontier/url-frontier";
import { AsyncQueue } from "./utils/AsyncQueue";
import { DePromisify } from "./utils/types";

export type MercatorSettings<T> = {
	urlFrontier: URLFrontier;
	dataFetcher: (string: Link) => T;
};

const defaultMercatorSettings: MercatorSettings<ReturnType<typeof scrapeMeta>> =
	{
		urlFrontier: new URLFrontier(),
		dataFetcher: scrapeMeta,
	} as const;

type F = unknown extends any ? true : false;

export type DefaultMercatorReturn = DePromisify<ReturnType<typeof scrapeMeta>>;
export class Mercator<U> {
	#settings: MercatorSettings<
		Promise<unknown extends U ? DefaultMercatorReturn : U>
	> = defaultMercatorSettings as any;
	#inFrontierCache: Map<
		string,
		Promise<unknown extends U ? DefaultMercatorReturn : U>
	> = new Map();
	#fetchingData: Map<
		string,
		Promise<unknown extends U ? DefaultMercatorReturn : U>
	> = new Map();

	constructor(settings?: Partial<MercatorSettings<Promise<U>>>) {
		if (settings?.dataFetcher && "dataFetcher" in settings) {
			this.#settings = {
				...defaultMercatorSettings,
				...settings,
				dataFetcher: settings.dataFetcher,
			} as any;
		} else {
			this.#settings = {
				...defaultMercatorSettings,
				...settings,
				dataFetcher:
					settings?.dataFetcher ?? defaultMercatorSettings.dataFetcher,
			} as any;
		}
	}

	async sendURL(url: Link) {
		const result = this.seedURL(url);
		await Promise.race([result, this.runToCompletion()]);
		return result;
	}

	async seedURL(url: string) {
		if (!this.#inFrontierCache.has(url)) {
			this.#inFrontierCache.set(
				url,
				this.#settings.urlFrontier
					.seedURL(url)
					.then(({ url }) => {
						return this.#getData(url);
					})
					.then((x) => {
						this.#inFrontierCache.delete(url);
						return x;
					})
			);
		}
		return (
			this.#inFrontierCache.get(url) ??
			Promise.reject(new Error("This should never be reached..."))
		);
	}

	async runToCompletion() {
		for await (const item of this) {
		}
	}

	async *[Symbol.asyncIterator]() {
		yield* this.#fetchURLs();
	}

	async #getData(url: string) {
		if (!this.#fetchingData.has(url)) {
			this.#fetchingData.set(
				url,
				this.#settings.dataFetcher(url).then((x) => {
					this.#fetchingData.delete(url);
					return x;
				})
			);
		}
		return (
			this.#fetchingData.get(url) ??
			Promise.reject(new Error("This should never be reached..."))
		);
	}

	async *#fetchURLs() {
		for await (const url of this.#settings.urlFrontier) {
			yield this.#getData(url);
		}
	}
}
