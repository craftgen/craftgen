import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const craftVariablesRouter = createTRPCRouter({
  getValue: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        key: z.string(),
        provider: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const variable = await ctx.db.query.variable.findFirst({
        where: (variable, { eq, and }) =>
          and(
            eq(variable.key, input.key),
            eq(variable.project_id, input.projectId),
          ),
      });
      return variable?.value!;
    }),
});
