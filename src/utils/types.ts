export type DePromisify<T extends Promise<any>> = T extends Promise<infer D>
	? D
	: never;
