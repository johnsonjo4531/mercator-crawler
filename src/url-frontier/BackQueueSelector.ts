import { sleep } from "../utils/GTOR";
import { URLFrontierSettings } from "./url-frontier";

export const backQueueSelector: URLFrontierSettings["backqueueSelector"] =
	async ({ backQueue, hostnameHeap, backQueueRouter }) => {
		while (true) {
			const hostname = await hostnameHeap.next();
			if (!hostname) return;
			const answer = await Promise.race([
				(await backQueueRouter({ backQueue, hostname }))?.dequeue(),
				sleep(0).then(() => null),
			]);
			if (answer) return answer;
			hostnameHeap.deleteHostname(hostname);
		}
	};
