import { assertEquals } from "jsr:@std/assert";

import { run } from "./main.ts";

Deno.test(function addTest() {
  assertEquals(run("2 + 3"), 5);
});
