declare module "@postlight/parser" {
	interface IParser {
		parse(
			url: string,
			options: { contentType: "markdown" | "html" | "text" }
		): Promise<{ author: string | undefined; content: string | undefined }>;
	}
	export const parse: IParser["parse"];
}
