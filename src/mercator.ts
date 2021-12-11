/** This is not as of yet a full mercator crawler.
 */

import { scrapeMeta } from "./metadata-fetcher";
import { Link, URLFrontier } from "./url-frontier/url-frontier";
import { AsyncQueue } from "./utils/AsyncQueue";

export type MercatorSettings<T> = {
	urlFrontier: URLFrontier;
	dataFetcher: (string: Link) => T;
};

type DePromisify<T extends Promise<any>> = T extends Promise<infer D>
	? D
	: never;

const defaultMercatorSettings: MercatorSettings<ReturnType<typeof scrapeMeta>> =
	{
		urlFrontier: new URLFrontier(),
		dataFetcher: scrapeMeta,
	} as const;

export class Mercator<T> {
	#settings!: MercatorSettings<Promise<T> | ReturnType<typeof scrapeMeta>>;
	#inFrontierCache: Map<
		string,
		Promise<T | DePromisify<ReturnType<typeof scrapeMeta>>>
	> = new Map();
	#fetchingData: Map<
		string,
		Promise<T | DePromisify<ReturnType<typeof scrapeMeta>>>
	> = new Map();

	constructor(settings: Partial<MercatorSettings<Promise<T>>> = {}) {
		if (settings.dataFetcher) {
			this.#settings = {
				...defaultMercatorSettings,
				dataFetcher: settings.dataFetcher,
				...settings,
			};
		} else {
			this.#settings = {
				...defaultMercatorSettings,
				...settings,
				dataFetcher: defaultMercatorSettings.dataFetcher,
			};
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
					.then((x: any) => {
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
		await this.#settings.urlFrontier.runToCompletion();
	}

	async *[Symbol.asyncIterator]() {
		yield* this.#fetchURLs();
	}

	async #getData(url: string): Promise<T | ReturnType<typeof scrapeMeta>> {
		if (!this.#fetchingData.get(url)) {
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
