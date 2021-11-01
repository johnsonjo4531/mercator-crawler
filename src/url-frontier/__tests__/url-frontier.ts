import { URLFrontier } from "../url-frontier";

test("Should be thenable", async () => {
    // setup
    const result1Fn = jest.fn();
    // use
    const frontier = new URLFrontier();
    frontier.sendURL("http://example.com").then(result1Fn)
    await frontier.runToCompletion();

    // assert
    expect(result1Fn).toBeCalledTimes(1);
    expect(result1Fn).toBeCalledWith({"cached": false, "url": "http://example.com/"});
})


test("Should Cache correctly", async () => {
    // setup
    const result1Fn = jest.fn();
    const result2Fn = jest.fn();
    // use
    const frontier = new URLFrontier();
    frontier.sendURL("http://example.com").then(result1Fn)
    frontier.sendURL("http://example.com").then(result2Fn)
    frontier.sendURL("http://example.com").then(result2Fn)
    frontier.sendURL("http://example.com").then(result2Fn)
    await frontier.runToCompletion();

    // assert
    expect(result1Fn).toBeCalledTimes(1);
    expect(result2Fn).toBeCalledTimes(3);
    expect(result1Fn).toBeCalledWith({"cached": false, "url": "http://example.com/"});
    expect(result2Fn).toBeCalledWith({"cached": true, "url": "http://example.com/"});
})

test("Should handle multiple calls and looping", async () => {
    // setup
    const result1 = jest.fn();
    const result2 = jest.fn();
    const result3 = jest.fn();
    const result4 = jest.fn();
    const result5 = jest.fn();
    const urls: string[] = [];
    // use
    const frontier = new URLFrontier();
    frontier.sendURL("http://example.com").then(result1)
    frontier.sendURL("http://foo.example.com").then(result2)
    frontier.sendURL("http://foo.example.com").then(result3)
    frontier.sendURL("http://foo.example.com/1234567").then(result4)
    frontier.sendURL("http://bar.example.com").then(result5)
    for await (const url of frontier) {
        urls.push(url);
    }

    // assert
    expect(result1).toBeCalledTimes(1);
    expect(result1).toBeCalledWith({ "cached": false, "url": "http://example.com/" });
    expect(result2).toBeCalledTimes(1);
    expect(result2).toBeCalledWith({ "cached": false, "url": "http://foo.example.com/" });
    expect(result3).toBeCalledTimes(1);
    expect(result3).toBeCalledWith({ "cached": true, "url": "http://foo.example.com/" });
    expect(result4).toBeCalledTimes(1);
    expect(result4).toBeCalledWith({ "cached": false, "url": "http://foo.example.com/1234567" });
    expect(result5).toBeCalledTimes(1);
    expect(result5).toBeCalledWith({ "cached": false, "url": "http://bar.example.com/" });
    expect(urls).toStrictEqual(["http://example.com/", "http://foo.example.com/", "http://bar.example.com/", "http://foo.example.com/1234567"])
})

test("Should call uncached before cached", async () => {
    // setup
    const urls: string[] = [];
    // use
    const frontier = new URLFrontier();
    const p1 = frontier.sendURL("http://example.com").then(() => 1)
    const p2 = frontier.sendURL("http://example.com").then(() => 2)
    for await (const url of frontier) {
        urls.push(url);
    }

    // assert
    // Do some asserts with .toBe and Promise.race
    expect(Promise.race([p1, p2])).resolves.toStrictEqual(1);
})

test("Should call earlier before later", async () => {
    // use
    const frontier = new URLFrontier();
    const p1 = frontier.sendURL("http://example.com").then(() => 1)
    const p2 = frontier.sendURL("http://foo.example.com").then(() => 2)
    await frontier.runToCompletion();

    // assert
    // Do some asserts with .toBe and Promise.race
    expect(Promise.race([p1, p2])).resolves.toBe(1);
})

test("Should call earlier before later", async () => {
    // use
    const frontier = new URLFrontier();
    const p1 = frontier.sendURL("http://example.com").then(() => 1)
    const p2 = frontier.sendURL("http://foo.example.com").then(() => 2)
    await frontier.runToCompletion();

    // assert
    // Do some asserts with .toBe and Promise.race
    expect(Promise.race([p1, p2])).resolves.toBe(1);
})

test("Should call different hostnames on time", async () => {
    // use
    const frontier = new URLFrontier();
    const p1 = frontier.sendURL("http://example.com").then(() => 1)
    const p2 = frontier.sendURL("http://example.com/1234").then(() => 2)
    const p3 = frontier.sendURL("http://foo.example.com").then(() => 3)
    await frontier.runToCompletion();

    // assert
    // Do some asserts with .toBe and Promise.race
    expect(Promise.race([p1, p2, p3])).resolves.toBe(1);
    expect(Promise.race([p3, p2])).resolves.toBe(2);
})


