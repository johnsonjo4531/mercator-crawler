import { sleep } from "../utils/GTOR";
import { URLFrontierSettings } from "./url-frontier";

export const backQueueSelector: URLFrontierSettings["backqueueSelector"] =
	async ({ backQueue, hostHeap, backQueueRouter }) => {
		while (true) {
			const host = await hostHeap.next();
			if (!host) return;
			const answer = await Promise.race([
				(await backQueueRouter({ backQueue, host }))?.dequeue(),
				sleep(0).then(() => null),
			]);
			if (answer) return answer;
			hostHeap.deleteHost(host);
		}
	};
