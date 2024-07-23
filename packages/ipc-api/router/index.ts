import { createTRPCRouter, publicProcedure } from "../trpc.ts";
import { packageRouter } from "./package.ts";

export const appRouter = createTRPCRouter({
  package: packageRouter,
  context: publicProcedure.query(({ ctx }) => {
    console.log("CONTEXT", ctx);

    return {
      type: typeof ctx.db,
      ctx: ctx.db,
      ses: ctx.session,
    };
    // return ctx.db.query.organizations.findMany();
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
