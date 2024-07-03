import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

function meanPizzasSold(pizzas: number[]): number {
  const total = pizzas.reduce((acc, curr) => acc + curr, 0);
  return total / pizzas.length;
}

Deno.test({
  name: "mean of pizzas sold",
  fn: () => {
    const pizzas = [92, 106, 96, 104, 96, 88];
    const expectedMean = 9723;
    assertEquals(meanPizzasSold(pizzas), expectedMean);
  },
});
