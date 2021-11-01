import { URLFrontierSettings } from "./url-frontier";

export const naiveRoundRobinSelector: () => URLFrontierSettings["biasedFrontQueueSelector"] =
	() => {
		let currentSelection = 0;
		return async ({ frontQueue }) => {
			if (currentSelection >= frontQueue.length) {
				currentSelection %= frontQueue.length;
			}
			return frontQueue[currentSelection++];
		};
	};
