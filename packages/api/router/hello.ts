import { z } from "npm:zod@3.23.8";

import { createTRPCRouter, publicProcedure } from "../trpc.ts";

export const helloRouter = createTRPCRouter({
  hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `Hello ${input ?? "World"}!`;
  }),
});
