export type ResultOf<T extends (...args: any) => any> = NonNullable<
  Awaited<ReturnType<T>>
>;

export type ResultOfAction<T extends (...args: any) => any> = NonNullable<
  ResultOf<T>["data"]
>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
};
