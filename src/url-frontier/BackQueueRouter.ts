import { AsyncQueue } from "../utils/AsyncQueue";
import { URLFrontierSettings } from "./url-frontier";

export const politeByHost: URLFrontierSettings["backqueueRouter"] = async ({
	backQueue,
	host,
}) => {
	let queue = backQueue.get(host);
	if (!queue) {
		queue = new AsyncQueue();
		backQueue.set(host, queue);
	}
	return queue;
};
