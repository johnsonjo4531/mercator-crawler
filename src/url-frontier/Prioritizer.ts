import { URLFrontierSettings } from "./url-frontier";

// /** Round-robin queue */
export const naiveRoundRobinPrioritizer: URLFrontierSettings["frontQueuePrioritizer"] =
	async ({ frontQueue }) => {
		for (let i = 1; i < frontQueue.length; ++i) {
			if ((await frontQueue[i].size()) < (await frontQueue[i - 1].size())) {
				return frontQueue[i];
			}
		}
		return frontQueue[0];
	};
