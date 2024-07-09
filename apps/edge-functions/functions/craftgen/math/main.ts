import { evaluate } from "npm:mathjs/number";

export function run(expression: string): number {
  return evaluate(expression);
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log("Add 2 + 3 =", evaluate("2 + 3"));
}
