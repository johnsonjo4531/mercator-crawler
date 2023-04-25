import { URL as WHATWGURL } from "url";

import { sleep } from "../utils/GTOR";
import { Host, Link } from "./url-frontier";

export class HostHeap {
	#map = new Map<Host, number>([]);
	timeBetweenHostFetches = 2000;
	sleepTime = 50;

	insertURL(
		url: Link,
		time: number = Date.now() - this.timeBetweenHostFetches
	) {
		this.insertHost(new WHATWGURL(url).host, time);
	}

	insertHost(
		host: Host,
		time: number = Date.now() - this.timeBetweenHostFetches
	) {
		if (this.#map.has(host)) {
			const _time = this.#map.get(host) ?? Date.now();
			if (time > _time) {
				this.#map.set(host, time);
			}
			return;
		}
		this.#map.set(host, time);
	}

	deleteHost(host: Host) {
		this.#map.delete(host);
	}

	has(url: Host) {
		return this.#map.has(url);
	}

	async next() {
		await sleep(0);
		const { value: [host, time] = ["", 0], done } = this.#map.entries().next();
		this.#map.delete(host);
		// this guarantees politeness for the domain
		while (time >= Date.now() - this.timeBetweenHostFetches) {
			await sleep(this.sleepTime);
		}
		this.insertHost(host, Date.now());
		// resets the time for this host
		return host as Host;
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
