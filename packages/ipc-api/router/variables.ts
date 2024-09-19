import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc.ts";

export const variablesRouter = createTRPCRouter({
  getValue: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        key: z.string(),
        provider: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const variable = await ctx.tDb.query.variable.findFirst({
        where: (variable, { eq, and }) =>
          and(
            eq(variable.key, input.key),
            eq(variable.organizationId, input.organizationId),
          ),
      });
      return variable?.value!;
    }),
});
