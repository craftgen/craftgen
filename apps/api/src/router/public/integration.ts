import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";

export const integrationRouter = createTRPCRouter({
  categoryList: publicProcedure
    .input(z.object({ lang: z.string().optional().default("en") }))
    .query(async ({ ctx }) => {
      return ctx.db.query.integrationCategories.findMany({
        with: {
          translations: {
            where: (translation, { eq }) => eq(translation.languagesCode, "en"),
          },
        },
      });
    }),
  list: publicProcedure
    .input(
      z.object({
        lang: z.string().optional().default("en"),
        categoryId: z.string().optional(),
        featured: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const integrations = await ctx.db.transaction(async (tx) => {
        if (input.featured) {
          return await tx.query.integration.findMany({
            where: (integration, { eq, and }) =>
              and(
                eq(integration.featured, input.featured!),
                eq(integration.status, "published"),
              ),
            with: {
              translations: {
                where: (translation, { eq }) =>
                  eq(translation.languagesCode, input.lang),
              },
            },
          });
        }
        if (input.categoryId) {
          const integrationIds =
            (await tx.query.integrationIntegrationCategories
              .findMany({
                where: (integrationIntegrationCategories, { eq }) =>
                  eq(
                    integrationIntegrationCategories.integrationCategoriesId,
                    input.categoryId!,
                  ),
                columns: {
                  integrationId: true,
                },
              })
              .then((data) =>
                data
                  .map((item) => item.integrationId)
                  .filter((id) => id !== null),
              )) as string[];
          if (integrationIds.length === 0) {
            return [];
          }
          return await tx.query.integration.findMany({
            where: (integration, { and, eq, inArray }) =>
              and(
                inArray(integration.id, integrationIds),
                eq(integration.status, "published"),
              ),
            with: {
              translations: {
                where: (translation, { eq }) =>
                  eq(translation.languagesCode, input.lang),
              },
            },
          });
        }
        return await tx.query.integration.findMany({
          where: (integration, { eq }) => eq(integration.status, "published"),
          with: {
            translations: {
              where: (translation, { eq }) =>
                eq(translation.languagesCode, input.lang),
            },
          },
        });
      });
      return integrations;
    }),

  get: publicProcedure
    .input(
      z.object({ slug: z.string(), lang: z.string().optional().default("en") }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.integration.findFirst({
        where: (integration, { eq, and }) =>
          and(
            eq(integration.slug, input.slug),
            eq(integration.status, "published"),
          ),
        with: {
          translations: {
            where: (translation, { eq }) =>
              eq(translation.languagesCode, input.lang),
          },
          // solution: {
          //   with: {
          //     translations: {
          //       where: (translation, { eq }) =>
          //         eq(translation.languagesCode, input.lang),
          //     },
          //   },
          // },
        },
      });
    }),
});
