import { z } from "../deps.ts";
import { createTRPCRouter, publicProcedure } from "../trpc.ts";

export const helloRouter = createTRPCRouter({
  test: publicProcedure.input(z.string().nullish()).mutation(({ input }) => {
    return `Hello ${input ?? "World"}!`;
  }),
  hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `Hello ${input ?? "World"}!`;
  }),
});
