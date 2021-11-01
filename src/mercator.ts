/** This is not as of yet a full mercator crawler.
 */

import { scrapeMeta } from "./metadata-fetcher";
import { Link, URLFrontier } from "./url-frontier/url-frontier";

type MercatorSettings<T> = {
	urlFrontier: URLFrontier;
	dataFetcher: (string: Link) => T,
};

const defaultMercatorSettings: MercatorSettings<ReturnType<typeof scrapeMeta>> = {
	urlFrontier: new URLFrontier(),
	dataFetcher: scrapeMeta,
} as const;

class Mercator<T> {
	#settings!: MercatorSettings<T>;

	constructor(settings: Partial<MercatorSettings<T>>) {
		this.#settings = {
			...defaultMercatorSettings,
			...settings,
		};
	}

	sendURL() {}

	async runToCompletion() {
		for await (const item of this) {
		}
	}

	async next() {
		return {
			value: undefined,
			done: true,
		};
	}

	async *[Symbol.asyncIterator]() {
		
		yield* this.#fetchURLs();
	}

	async *#fetchURLs() {
		for await (const item of this.#settings.urlFrontier) {
			yield this.#settings.;
		}
	}
}

(async () => {
	const start = Date.now();
	const frontier = new URLFrontier();
	frontier.sendURL("http://example.com");
	frontier.sendURL("http://foo.example.com");
	frontier.sendURL("http://foo.example.com");
	frontier.sendURL("http://foo.example.com/1234567");
	frontier.sendURL("http://foo.example.com/12345678");
	frontier.sendURL("http://bar.example.com");
	for await (const url of frontier) {
		console.log(
			`it took ${Date.now() - start}ms for this url to be ready to grab`,
			url
		);
	}
	// frontier.runToCompletion();
})();
