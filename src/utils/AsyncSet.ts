/** A set is an abstract data-type. See the wikipedia for more info: 
*   Sets are a collection of items in which no item is ever repeated. What that means is whenever an item is entered into the set if it currently exists it will not be added (or it will be replaced) 
*   The add command adds to the set whereas the. FIFO is as opposed to Last-In First-Out (LIFO)
*   (which is also known as First-In Last-Out (FILO)). LIFO is usually implemented with what is called a stack.
*
* FAQ:
* Why are the methods set and enqueue async?
* The methods set and enqueue are async so we can store the set in redis or a similar cache if we want to
* which will then make the URL-frontier more easily distributable across machines. 
*
* @example
* // You can use a self-invoked anonymous async function if you are not in a function already.
* // We use async functions so we can use await.
* (async () => {
*   // Create the set.
*   const set = new Set<string>();
*   // Put items into the set:
*   await set.enqueue("foo");
*   await set.enqueue("bar");
*   // Take items out of set
*   console.log(await set.delete()); // logs "foo".
*   console.log(await set.delete()); // logs "bar".
* })();
*/
export class AsyncSet<T> {
    /** A hash tells you this field is private. 
     * Right now the underlying set is part of the
     * instance but since add, remove, etc, are all async
     * the set could be in a different location such as redis.
    */
    #set = new Set();

    /** This method allows one to take from the set. */
    async delete(item: T) {
        return this.#set.delete(item);
    }

    /** This method allows one to add to the set. */
    async add(item: T) {
        this.#set.add(item);
    }

    /** This method allows one to check if an item already exists in a set. */
    async has(item: T) {
        this.#set.has(item);
    }

    async flush() {
        this.#set.clear();
    }

    /** This method creates a set from an Iterable. */
    static async from<T>(items: Iterable<T>) {
        const set = new AsyncSet<T>();
        const promises = [];
        for (const item of items) {
            promises.push(set.add(item));
        }
        await Promise.all(promises);
        return set;
    }
}
