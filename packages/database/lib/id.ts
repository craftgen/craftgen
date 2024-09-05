import { init } from "@paralleldrive/cuid2";

const createId = init({
  length: 10,
});

export const createIdWithPrefix =
  (prefix: string, separator: string = "_") =>
  () =>
    `${prefix}${separator}${createId()}`;
