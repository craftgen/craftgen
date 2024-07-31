import { event } from "../../database/tenant/schema/events.ts";
import { context } from "../../database/tenant/schema/index.ts";
import { timestring, z } from "../deps.ts";
import { createTRPCRouter, publicProcedure } from "../trpc.ts";
import { packageRouter } from "./package.ts";

export const appRouter = createTRPCRouter({
  package: packageRouter,
  context: publicProcedure
    .input(
      z.object({
        type: z.string(),
        payload: z.any(),
        delay: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const event = {
        type: input.type,
        payload: input.payload,
        delay: input.delay,
      };

      await ctx.kv.enqueue(event, {
        delay: timestring(input.delay, "ms"),
      });

      return {
        event,
      };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
