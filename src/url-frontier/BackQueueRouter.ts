import { AsyncQueue } from "../utils/AsyncQueue";
import { URLFrontierSettings } from "./url-frontier";

export const politeByHostname: URLFrontierSettings["backqueueRouter"] = async ({
	backQueue,
	hostname,
}) => {
	let queue = backQueue.get(hostname);
	if (!queue) {
		queue = new AsyncQueue();
		backQueue.set(hostname, queue);
	}
	return queue;
};
