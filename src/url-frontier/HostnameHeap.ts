import { URL as WHATWGURL } from "url";

import { sleep } from "../utils/GTOR";
import { Hostname, Link } from "./url-frontier";

export class HostnameHeap {
	#map = new Map<Hostname, number>([]);
	timeBetweenHostnameFetches = 2000;
	sleepTime = 50;

	insertURL(
		url: Link,
		time: number = Date.now() - this.timeBetweenHostnameFetches
	) {
		this.insertHostname(new WHATWGURL(url).hostname, time);
	}

	insertHostname(
		hostname: Hostname,
		time: number = Date.now() - this.timeBetweenHostnameFetches
	) {
		if (this.#map.has(hostname)) {
			const _time = this.#map.get(hostname) ?? Date.now();
			if (time > _time) {
				this.#map.set(hostname, time);
			}
			return;
		}
		this.#map.set(hostname, time);
	}

	deleteHostname(hostname: Hostname) {
		this.#map.delete(hostname);
	}

	has(url: Hostname) {
		return this.#map.has(url);
	}

	async next() {
		await sleep(0);
		const { value: [hostname, time] = ["", 0], done } = this.#map
			.entries()
			.next();
		this.#map.delete(hostname);
		// this guarantees politeness for the domain
		while (time >= Date.now() - this.timeBetweenHostnameFetches) {
			await sleep(this.sleepTime);
		}
		this.insertHostname(hostname, Date.now());
		// resets the time for this hostname
		return hostname as Hostname;
	}
	async return() {
		this.#map.clear();
		return { value: undefined, done: true };
	}
	async throw() {
		this.#map.clear();
		return { value: undefined, done: true };
	}

	[Symbol.asyncIterator]() {
		return this;
	}
}
