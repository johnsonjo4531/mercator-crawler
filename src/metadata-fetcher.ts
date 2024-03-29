/**
 * General client module for making requests to other servers!
 * @module utils/client */
import * as htmlparser from "htmlparser2";
import { Handler } from "htmlmetaparser";
import got, { Options } from "got";
import { Writable } from "stream";
import { Thing } from "schema-dts";
import { URL } from "url";
import { decodeHTML } from "entities";
import { Merge } from "./types/types";
import * as Parser from "@postlight/parser";
import magic from "stream-mmmagic";

export type TypedLD<T, S = string> = Extract<
	T,
	{
		"@type": S;
	}
>;

export type TypedThing = TypedLD<Thing>;

export type WebPageMeta = {
	alternate: any[];
	applinks: {
		"android:app_name": string;
		"android:package": string;
		"android:url": string;
		"ios:app_name": string;
		"ios:app_store_id": string;
		"ios:url": string;
		"web:url": string;
		[key: string]: string;
	};
	html: {
		author: string;
		canonical: string; // URL
		description: string;
		robots: string; // 'index, follow'
		title: string;
		viewport: string;
	};
	jsonld: (TypedThing & { "@context": any })[];
	rdfa: unknown;
	twitter: {
		"app:id:iphone": string;
		"app:name:iphone": string;
		"app:url:iphone": string;
		card: string;
		creator: string;
		description: string;
		"image:src": string;
		site: string;
		[key: string]: string;
	};
};

function createMetaParser(
	url: string,
	cb: ConstructorParameters<typeof Handler>[0]
) {
	const handler = new Handler(cb, {
		url, // The HTML pages URL is used to resolve relative URLs.
	});

	// Create a HTML parser with the handler.
	return new htmlparser.Parser(handler, { decodeEntities: true });
}

/**
 * Scrapes an article by getting metadata, parsing its main content, and returns parsed markdown and metadata
 * @param {String} url
 * The url to fetch passed to both the fetch params and for resolving urls in the main content markdown.
 * @param {...any} otherFetchParams
 * All other parameters are passed directly to a node-fetch call.
 * @returns
 * An object containing properties `articleBody` and `metadata`
 * @example
 * scrapeArticle("").then(function (article) {
 *  console.log(article.metadata);
 *  console.log(article.markdown);
 * });
 */
export async function scrapeMeta(
	url: string,
	options: Merge<
		Options,
		{ isStream?: true; articleBody: boolean; metaData: boolean }
	> = {
		articleBody: true,
		metaData: true,
	}
) {
	const url2 = new URL(url);
	options = Object.assign({
		...options,
		headers: {
			"content-type": "text/html; charset=utf-8",
			"content-encoding": "gzip",
			"user-agent": "Metadata-Fetcher Bot",
			...(options.headers ?? {}),
		},
	});
	const stream = got.stream(url, { ...options });
	const [mime] = await magic.promise(stream);
	const mtype = typeof mime === "string" ? mime : mime.type;

	const [articleBody, metadata] =
		mtype === "text/html"
			? await Promise.all([
					Parser.parse(url2.href, { contentType: "text" })
						.then((x) => x.content)
						.catch((err) => {
							if (!/Content.*not.*text/gi.test(err.message)) throw err;
						}),
					new Promise<WebPageMeta | undefined>((resolve, reject) => {
						if (!options.metaData) {
							return resolve(undefined);
						}
						const meta = createMetaParser(
							url2.href,
							function (err: any, result: any) {
								if (err) return reject(err);
								resolve(result);
							}
						);
						got
							.stream(url, options)
							.on("error", reject)
							.pipe(
								new Writable({
									write: function (chunk, encoding, next) {
										try {
											meta.write(chunk);
										} catch (err) {
											reject(err);
											meta.end();
											return next(null);
										}
										next();
									},
								})
							)
							.on("error", reject)
							.on("finish", () => {
								meta.end();
							});
					}),
			  ])
			: ["", undefined];

	return {
		metadata,
		articleBody: articleBody?.trim() ?? "",
	};
}
