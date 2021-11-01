import { GTORAsyncQueue } from "./GTOR";

/** A queue is an abstract data-type. See the wikipedia for more info: https://en.wikipedia.org/wiki/Queue_(abstract_data_type)
*   Queues are what is called a First-In First-Out (FIFO) data-type. What that means is what ever is entered into the queue first 
*   with the enqueue command will also exit the queue first with its dequeue command. FIFO is as opposed to Last-In First-Out (LIFO)
*   (which is also known as First-In Last-Out (FILO)). LIFO is usually implemented with what is called a stack.
*
* FAQ:
* Why are the methods queue and enqueue async?
* The methods queue and enqueue are async so we can store the queue in redis or a similar cache if we want to
* which will then make the URL-frontier more easily distributable across machines. 
*
* @example
* // You can use a self-invoked anonymous async function if you are not in an async function already.
* // We use async functions so we can use await.
* (async () => {
*   // Create the queue.
*   const queue = new AsyncQueue<string>();
*   // Put items into the queue:
*   await queue.enqueue("foo");
*   await queue.enqueue("bar");
*   // Take items out of queue
*   console.log(await queue.dequeue()); // logs "foo".
*   console.log(await queue.dequeue()); // logs "bar".
* })();
@example
* // You can use a self-invoked anonymous async function if you are not in an async function already.
* // We use async functions so we can use await.
* (async () => {
*   // Create the queue from an iterable.
*   const queue = await AsyncQueue.from<string>(["foo", "bar"]);
*   console.log(await queue.dequeue()); // logs "foo".
*   console.log(await queue.dequeue()); // logs "bar".
* })();
*/
export class AsyncQueue<T> {
    /** A hash tells you this field is private.
     * Right now the underlying queue is part of the
     * instance but since enqueue, dequeue, etc, are all async
     * the queue could be in a different location such as redis.
    */
   #queue = new GTORAsyncQueue<T>();

    /** This method allows to take from the queue. */
    async dequeue() {
        return this.#queue.take();
    }

    /** This method allows to add to the queue. */
    async enqueue(item: T) {
        return this.#queue.put(item);
    }

    async size () {
        return this.#queue.length;
    }

    /** This method creates a queue from an Iterable. 
     * It is async because the items take time to enqueue 
     **/
    static async from<T>(items: Iterable<T>) {
        const queue = new AsyncQueue<T>();
        const promises = [];
        for (const item of items) {
            promises.push(queue.enqueue(item));
        }
        await Promise.all(promises);
        return queue;
    }

    [Symbol.asyncIterator] () {
        return this.#queue[Symbol.asyncIterator]();
    }
}

class RedisQueue<T> extends AsyncQueue<T> {
    // TODO: implement a redis AsyncQueue.
}
