import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";

export const solutionRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ lang: z.string().optional().default("en") }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.solution.findMany({
        where: (solution, { eq }) => eq(solution.status, "published"),
        with: {
          translations: {
            where: (translation, { eq }) =>
              eq(translation.languagesCode, input.lang),
          },
        },
      });
    }),

  get: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        lang: z.string().optional().default("en"),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.solution.findFirst({
        where: (solution, { eq, and }) =>
          and(eq(solution.slug, input.slug), eq(solution.status, "published")),
        with: {
          translations: {
            where: (translation, { eq }) =>
              eq(translation.languagesCode, input.lang),
          },
        },
      });
    }),
});
