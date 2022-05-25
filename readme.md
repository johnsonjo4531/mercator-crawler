# Mercator Crawler

Provides a URL-frontier, MetaData fetcher, URL Deduper, and is very plug and play friendly 😄.

To run the default Mercator Crawler with no options (this will fetch metadata and provide a readability like function that grabs the main content/article body):

```js
import { Mercator } from "mercator-crawler";

(async () => {
	const mercator = new Mercator();

	// do not await this seedURL. You can only await it after you have called runToCompletion or iterated through all the data sent back.
	mercator.seedURL("https://www.wsj.com/articles/magnus-carlsen-ian-nepomniachtchi-world-chess-championship-computer-analysis-11639003641").then(x => {
		console.log(x);
	});

	await mercator.runToCompletion();
})();
```

Example 2:

```js
import { Mercator } from "mercator-crawler";

(async () => {
	const mercator = new Mercator();

	// The sendURL can be awaited as it automatically runs to completion.
	const {articleBody, metadata} = await mercator.sendURL("https://www.wsj.com/articles/magnus-carlsen-ian-nepomniachtchi-world-chess-championship-computer-analysis-11639003641");
	
	console.log(articleBody);
	console.log(metadata);
})();
```

## URL Frontier

A URL Frontier's job is to provide preference and politeness.

Currently there is very little preference built-in (you could provide your own through the MercatorSettings).

## Metadata fetcher

Fetches general info about a given url.

## URL Deduper

This isn't the technical term, but it basically allows you to stop duplicate urls from entering the URL Frontier at the same time.

## Resources

Video on web crawling (follows a similar architecture to the IR book): https://www.youtube.com/watch?v=BKZxZwUgL3Y
Single Chapter on URL frontier: https://nlp.stanford.edu/IR-book/html/htmledition/the-url-frontier-1.html
Book on Information Retrieval (look at the 19th and 20th chapters ["Web search basics" and "Web crawling and indexes"]): https://nlp.stanford.edu/IR-book/

