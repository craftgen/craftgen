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
      console.log("INPUT", input);
      console.log("QUEUE", ctx.queue);

      const event = {
        type: input.type,
        payload: input.payload,
        delay: input.delay,
      };

      await ctx.queue.enqueueEvent({
        machineId: "123",
        type: input.type,
        payload: input.payload,
      });

      return {
        event,
      };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
