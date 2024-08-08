import { z } from "../deps.ts";
import { createTRPCRouter, publicProcedure } from "../trpc.ts";

export const fsRouter = createTRPCRouter({
  read: publicProcedure.query(async () => {
    const file = await Deno.readFile("./test.txt");
    return file.toString();
  }),
  readDir: publicProcedure
    .input(
      z.object({
        path: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const dirEntries = [];
      for await (const dirEntry of Deno.readDir(input.path)) {
        dirEntries.push(dirEntry);
      }
      return dirEntries;
    }),
  write: publicProcedure.query(async () => {
    const file = await Deno.writeFile("./test.txt", "Hello, world!");
    return file;
  }),
  exists: publicProcedure.query(async () => {
    const file = await Deno.stat("./test.txt");
    return file;
  }),
});
