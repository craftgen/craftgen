import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

export default function countNGrams(
  text: string,
  n: number,
): Record<string, number> {
  const ngrams: Record<string, number> = {};
  for (let i = 0; i <= text.length - n; i++) {
    const ngram = text.slice(i, i + n);
    if (ngrams[ngram]) {
      ngrams[ngram] += 1;
    } else {
      ngrams[ngram] = 1;
    }
  }
  return ngrams;
}

Deno.test({
  name: "countNGrams correctly counts 2-grams",
  fn: () => {
    const text = "banana";
    const result = countNGrams(text, 2);
    const expected = { ba: 1, an: 2, na: 2 };
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "countNGrams correctly counts 3-grams",
  fn: () => {
    const text = "banana";
    const result = countNGrams(text, 3);
    const expected = { ban: 1, ana: 2, nan: 1 };
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "countNGrams returns empty object for n larger than text length",
  fn: () => {
    const text = "hi";
    const result = countNGrams(text, 3);
    const expected = {};
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "countNGrams returns empty object for empty text",
  fn: () => {
    const text = "";
    const result = countNGrams(text, 2);
    const expected = {};
    assertEquals(result, expected);
  },
});
