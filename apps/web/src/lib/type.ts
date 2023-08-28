export type ResultOf<T extends (...args: any) => any> = NonNullable<
  Awaited<ReturnType<T>>
>;

