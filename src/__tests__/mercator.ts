import type { Server } from "http";
import { Mercator } from "../mercator";
import { staticServer } from "../utils/crawlable-server";
import { DePromisify } from "../utils/types";

const serverPorts = [15432, 15431];
let servers: Server[] = [];
beforeAll(() => {
	// setup 2 servers
	servers.push(staticServer("../../public-test/").listen(serverPorts[0]));
	servers.push(staticServer("../../public-test-2/").listen(serverPorts[1]));
});

jest.setTimeout(15_000);
test("Mercator basic", async () => {
	try {
		const mercator = new Mercator();
		const rData: any[] = [];
		const sameData1: any[] = [];
		const sameData2: any[] = [];
		for (const port of serverPorts) {
			mercator
				.seedURL(`http://localhost:${port}/index.html`)
				?.then((data: any) => {
					rData.push(data);
					sameData1.push(data);
				});
			mercator.seedURL(`http://localhost:${port}/index.html`)?.then((data) => {
				sameData2.push(data);
			});
			mercator
				.seedURL(`http://localhost:${port}/foo.html`)
				?.then((data: any) => {
					rData.push(data);
				});
		}
		const data: DePromisify<ReturnType<Mercator<unknown>["seedURL"]>>[] = [];
		for await (const datum of mercator) {
			data.push(datum);
		}
		expect(data[0].articleBody).toBeTruthy();
		expect(data[0].metadata).toBeTruthy();
		expect(rData).toHaveLength(4);
		expect(data).toEqual(rData);
		expect(sameData1).toEqual(sameData2);
		expect(data).toMatchInlineSnapshot(`
Array [
  Object {
    "articleBody": "This is a news article!",
    "metadata": Object {
      "alternate": Array [],
      "html": Object {
        "title": "Document",
        "viewport": "width=device-width, initial-scale=1.0",
      },
      "icons": Array [],
      "images": Array [],
      "jsonld": Array [
        Object {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "author": Object {
            "@type": "Person",
            "name": "Patrick Coombe",
          },
          "dateModified": "2019-01-05T09:20:00+08:00",
          "datePublished": "2019-01-05T08:00:00+08:00",
          "description": "A most wonderful article",
          "headline": "Article headline",
          "image": Array [
            "https://patrickcoombe.com/wp-content/uploads/2014/05/patrick-coombe.jpg",
            "https://example.com/photos/4x3/photo.jpg",
            "https://example.com/photos/16x9/photo.jpg",
          ],
          "mainEntityOfPage": Object {
            "@id": "https://example.com/my-news-article",
            "@type": "WebPage",
          },
          "publisher": Object {
            "@type": "Organization",
            "logo": Object {
              "@type": "ImageObject",
              "url": "https://elitestrategies-elitestrategies.netdna-ssl.com/wp-content/uploads/2013/04/elitestrategies.png",
            },
            "name": "Elite Strategies",
          },
        },
      ],
      "links": Array [],
    },
  },
  Object {
    "articleBody": "foo",
    "metadata": Object {
      "alternate": Array [],
      "html": Object {
        "title": "Document",
        "viewport": "width=device-width, initial-scale=1.0",
      },
      "icons": Array [],
      "images": Array [],
      "links": Array [],
    },
  },
  Object {
    "articleBody": "index2",
    "metadata": Object {
      "alternate": Array [],
      "html": Object {
        "title": "Document",
        "viewport": "width=device-width, initial-scale=1.0",
      },
      "icons": Array [],
      "images": Array [],
      "links": Array [],
    },
  },
  Object {
    "articleBody": "foo2",
    "metadata": Object {
      "alternate": Array [],
      "html": Object {
        "title": "Document",
        "viewport": "width=device-width, initial-scale=1.0",
      },
      "icons": Array [],
      "images": Array [],
      "links": Array [],
    },
  },
]
`);
	} catch (err) {
		console.error(err);
	}
});

test("Mercator dataFetcher", async () => {
	const mercator = new Mercator({
		async dataFetcher() {
			return { foo: "bar" } as const;
		},
	});
	const data = await mercator.sendURL(
		`http://localhost:${serverPorts[0]}/index.html`
	);

	// This also checks our types for us.
	// Types will fail if this isn't properly done
	expect(data.foo === "bar").toBeTruthy();
});

afterAll(() => {
	for (const server of servers) {
		server.close();
	}
});
