import { GTORishAsyncMap } from "../GTOR";

test("GTORishAsyncMap basic usage", () => {
	const map = new GTORishAsyncMap();

	map.put("A", Promise.resolve("B"));

	expect(map.has("A")).toBe(true);
	expect(map.take("A")).resolves.toBe("B");
});

test("GTORishAsyncMap peek", () => {
	const map = new GTORishAsyncMap();

	map.put("A", Promise.resolve("B"));
	const peek = map.take("A");
	map.put("A", peek);
	const newValue = peek.then((x) => "C");

	expect(map.take("A")).resolves.toBe("B");
	expect(newValue).resolves.toBe("C");
});

test("GTORishAsyncMap entries", () => {
	const map = new GTORishAsyncMap();

	map.put("A", Promise.resolve("B"));
	map.put("B", Promise.resolve("C"));

	expect([...map.keys()]).toEqual(["A", "B"]);
});
