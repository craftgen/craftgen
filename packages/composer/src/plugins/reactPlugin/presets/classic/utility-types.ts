type UnionToIntersection<U> = (
  U extends never ? never : (arg: U) => never
) extends (arg: infer I) => void
  ? I
  : never;

type StrictExcludeInner<T, U> = 0 extends (
  U extends T ? ([T] extends [U] ? 0 : never) : never
)
  ? never
  : T;
type StrictExclude<T, U> = T extends unknown ? StrictExcludeInner<T, U> : never;

type UnionToTuple<T> =
  UnionToIntersection<T extends never ? never : (t: T) => T> extends (
    _: never,
  ) => infer W
    ? [...UnionToTuple<StrictExclude<T, W>>, W]
    : [];

type TupleToObject<T extends readonly any[], Rest extends object> = {
  [K in keyof T]: React.JSXElementConstructor<{ data: T[K] } & Rest>;
}[number];

// eslint-disable-next-line @typescript-eslint/ban-types
export type AcceptComponent<T, Rest extends object = {}> = TupleToObject<
  UnionToTuple<T>,
  Rest
>;
