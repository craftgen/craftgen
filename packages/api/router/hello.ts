import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc.ts";

export const helloRouter = createTRPCRouter({
  hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `Hello ${input ?? "World"}!`;
  }),
});
