import { Server } from "http";
import { Mercator } from "../mercator";
import { staticServer } from "../utils/crawlable-server";

(async () => {
	const serverPorts = [15432, 15431];
	let servers: Server[] = [];
	// setup 2 servers
	servers.push(staticServer("../../public-test/").listen(serverPorts[0]));
	const mercator = new Mercator({
		async dataFetcher() {
			return { foo: "bar" } as const;
		},
	});

	const data = await mercator.sendURL(
		`http://localhost:${serverPorts[0]}/index.html`
	);

	console.log(data);
	for (const server of servers) {
		server.removeAllListeners();
	}
})();
