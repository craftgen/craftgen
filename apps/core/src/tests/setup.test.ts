import { test, expect } from "bun:test";
import { createHeadlessEditor } from "..";

test("Can create editor", async () => {
  const editor = await createHeadlessEditor({
    nodes: [],
    edges: [],
  });
  console.log(editor);

});
