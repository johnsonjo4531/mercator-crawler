import { GTORishAsyncMap } from "./GTOR";

/** A map is an abstract data-type. See the wikipedia for more info: https://en.wikipedia.org/wiki/Associative_array
*
 FAQ:
* Why are the methods for map async?
* The methods are async so we can store the map in redis or a similar cache if we want to
* which will then make the URL-frontier more easily distributable across machines. 
*/
export class AsyncMap<T, U> {
	/** A hash tells you this field is private.
	 * Right now the underlying map is part of the
	 * instance but since enqueue, dequeue, etc, are all async
	 * the queue could be in a different location such as redis.
	 */
	#map = new GTORishAsyncMap<T, U>();

	/** This method allows one to put into the map. */
	async put(key: T, value: U) {
		return this.#map.put(key, value);
	}

	/** This method allows one to take from the map. */
	async take(item: T) {
		return this.#map.take(item);
	}

	async has(item: T) {
		return this.#map.has(item);
	}

	/** This method creates a queue from an Iterable.
	 * It is async because the items take time to enqueue
	 **/
	static async from<T, U>(items: Iterable<[T, U]>) {
		const queue = new AsyncMap<T, U>();
		const promises = [];
		for (const [key, item] of items) {
			promises.push(queue.put(key, item));
		}
		await Promise.all(promises);
		return queue;
	}
}

class RedisMap<T, U> extends AsyncMap<T, U> {
	// TODO: implement a redis AsyncQueue.
}
