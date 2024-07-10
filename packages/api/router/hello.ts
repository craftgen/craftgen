import { initTRPC } from "npm:@trpc/server@10.45.2";
import { z } from "npm:zod@3.23.8";

const t = initTRPC.create();

const publicProcedure = t.procedure;
const router = t.router;

export const helloRouter = router({
  hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `Hello ${input ?? "World"}!`;
  }),
});
