type IDeferred<T>  = {
    promise: Promise<T>,
    resolve: (value: T) => void,
    reject: (error: any) => void
};
export const Deferred = <T>(): IDeferred<T> => {
    let resolve!: (value: T) => void, reject!: (error: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        promise,
        resolve,
        reject
    }
}

type QueueType<T> = {
	head: T;
	tail: Promise<QueueType<T>>;
};

export class GTORAsyncQueue<T> {
	#ends = Deferred<QueueType<T>>();
    length = 0;

    async put(value: T) {
        this.length++;
        const next = Deferred<QueueType<T>>();
        this.#ends.resolve({
            head: value,
            tail: next.promise,
        });
        this.#ends.resolve = next.resolve;
    }

    async take() {
        const result = this.#ends.promise.then(({ head }) => head);
        this.#ends.promise = this.#ends.promise.then(({ tail }) => tail);
        return result;
    }

    [Symbol.asyncIterator] () {
        return {
            next: async () => {
                const value = await this.take();
                return { value, done: false };
            },
            throw:  async () => {
                this.#ends = Deferred()
                return { value: undefined, done: true }
            },
            return:  async () => {
                this.#ends = Deferred()
                return { value: undefined, done: true }
            },
        }
    }
}

export class GTORishAsyncMap<K, T> {
	mapping = new Map<K, GTORAsyncQueue<T>>();

    async put(key: K, value: T) {
        const nullablePromise = this.mapping.get(key)?.put(value);
        if(!nullablePromise) {
            const queue = new GTORAsyncQueue<T>();
            this.mapping.set(key, queue);
            queue.put(value);
        }
    }

    async take(key: K) {
        const nullablePromise = this.mapping.get(key)?.take();
        if(!nullablePromise) {
            const queue = new GTORAsyncQueue<T>();
            this.mapping.set(key, queue);
            return queue.take();
        }
        return nullablePromise;
    }

    async has (key: K) {
        return (this.mapping.get(key)?.length ?? 0) > 0;
    }

    async entries () {
        return this.mapping.entries();
    }
    
}

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))