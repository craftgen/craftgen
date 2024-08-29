import { z } from "../deps.ts";
import { createTRPCRouter, publicProcedure } from "../trpc.ts";
import { authRouter } from "./auth.ts";
import { craftRouter } from "./craft/index.ts";
import { fsRouter } from "./file.ts";
import { orgRouter } from "./org.ts";
import { packageRouter } from "./package.ts";
import { variablesRouter } from "./variables.ts";

export const appRouter = createTRPCRouter({
  package: packageRouter,
  fs: fsRouter,
  craft: craftRouter,
  project: orgRouter,
  variables: variablesRouter,
  auth: authRouter,
  context: publicProcedure
    .input(
      z.object({
        machineId: z.string(),
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

      await ctx.queue.enqueueEvent({
        machineId: input.machineId,
        type: input.type,
        payload: input.payload,
        scheduledFor: new Date(),
      });

      return {
        event,
      };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
