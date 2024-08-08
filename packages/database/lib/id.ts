import { init } from "@paralleldrive/cuid2";

const createId = init({
  length: 10,
});

export const createIdWithPrefix = (prefix: string) => () =>
  `${prefix}_${createId()}`;
