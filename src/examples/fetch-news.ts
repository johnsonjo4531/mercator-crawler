import { Mercator } from "../mercator";

(async () => {
	const mercator = new Mercator();

	// do not await this seedURL. You can only await it after you have called runToCompletion or iterated through all the data sent back.
	mercator
		.seedURL(
			"https://www.wsj.com/articles/magnus-carlsen-ian-nepomniachtchi-world-chess-championship-computer-analysis-11639003641"
		)
		.then((x) => {
			console.log(x.articleBody);
		});

	await mercator.runToCompletion();
})();
