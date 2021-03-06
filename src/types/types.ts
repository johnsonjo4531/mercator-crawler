export type Except<ObjectType, KeysType extends keyof ObjectType> = Pick<
	ObjectType,
	Exclude<keyof ObjectType, KeysType>
>;
export type Merge<FirstType, SecondType> = Except<
	FirstType,
	Extract<keyof FirstType, keyof SecondType>
> &
	SecondType;
