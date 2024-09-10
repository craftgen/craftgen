import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";

import { map } from "@/.map";

export const { getPage, getPages, pageTree } = loader({
  baseUrl: "/docs",
  rootDir: "docs",
  source: createMDXSource(map),
});
