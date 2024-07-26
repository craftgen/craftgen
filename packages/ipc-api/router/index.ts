import { context } from "../../database/tenant/schema/index.ts";
import { createTRPCRouter, publicProcedure } from "../trpc.ts";
import { packageRouter } from "./package.ts";

export const appRouter = createTRPCRouter({
  package: packageRouter,
  context: publicProcedure.query(async ({ ctx }) => {
    const ddd = await ctx.db
      .insert(context)
      .values({
        type: "NodeModule",
        organizationId: "123",
        workflow_id: "123",
        previousContextId: "123",
        snapshot: {
          foo: "json",
        },
      })
      .returning();
    const contexts = await ctx.db.query.context.findMany({
      where: (context, { eq }) => eq(context.id, "12"),
    });

    return {
      contexts,
      context: ddd,
    };
    // return ctx.db.query.organizations.findMany();
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
