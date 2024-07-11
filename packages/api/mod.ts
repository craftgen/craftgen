import { z } from "./deps.ts";
import { packageRouter } from "./router/package.ts";
import { createTRPCRouter, publicProcedure } from "./trpc.ts";

export { createTRPCContext } from "./trpc.ts";

export const appRouter = createTRPCRouter({
  package: packageRouter,
  toast: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `Hey ${input ?? "World"}!`;
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
