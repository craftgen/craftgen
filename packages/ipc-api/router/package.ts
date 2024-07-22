import { z } from "../deps.ts";
import { createTRPCRouter, publicProcedure } from "../trpc.ts";

export const packageRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
      }),
    )
    .query(({ input }) => {
      return `Hello ${input ?? "World"}!`;
    }),

  cwd: publicProcedure.query(() => {
    return Deno.cwd();
  }),

  get: publicProcedure
    .input(
      z.object({
        path: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const files = [];
      for await (const dirEntry of Deno.readDir(input.path)) {
        files.push(dirEntry);
      }
      return {
        files,
      };
    }),
});
