import { isNil } from "lodash-es";
import { z } from "zod";

import { eq, sql, variable } from "@craftgen/db/db";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

type ProviderType = "OPENAI" | "REPLICATE" | "OTHER";

export const credentialsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        // projectId: z.string(),
        provider: z.custom<ProviderType>().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.user_metadata.currentProjectSlug) {
        return [];
      }
      return await ctx.db.transaction(async (tx) => {
        const project = await tx.query.project.findFirst({
          where: (p, { eq }) =>
            eq(p.slug, ctx.session.user.user_metadata.currentProjectSlug),
        });
        if (!project) {
          return [];
        }
        return await ctx.db.query.variable.findMany({
          where: (token, { eq, and }) =>
            and(
              eq(token.project_id, project?.id),
              input?.provider ? eq(token.provider, input.provider) : sql`true`,
            ),
          // columns: {
          //   value: true,
          // },
        });
      });
    }),

  hasKeyForProvider: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        provider: z.custom<ProviderType>(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const credentials = await ctx.db.query.variable.findFirst({
        where: (token, { eq, and }) =>
          and(
            eq(token.project_id, input.projectId),
            eq(token.provider, input.provider),
          ),
      });
      return !!credentials;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete(variable).where(eq(variable.id, input.id));
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        key: z.string(),
        value: z.string(),
        default: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(variable)
        .set({ key: input.key, value: input.value })
        .where(eq(variable.id, input.id))
        .returning();
    }),

  setDefault: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const token = await ctx.db.query.variable.findFirst({
        where: (variable, { eq }) => eq(variable.id, input.id),
      });
      if (!token) {
        throw new Error("Variable not found");
      }
      if (token.provider === "OTHER") {
        throw new Error("Cannot set default for OTHER provider");
      }
      await ctx.db.transaction(async (tx) => {
        const existingDefault = await tx.query.variable.findFirst({
          where: (variable, { eq, and }) =>
            and(
              eq(variable.project_id, token.project_id),
              !isNil(token.provider)
                ? eq(variable.provider, token.provider)
                : undefined,
              eq(variable.default, true),
            ),
        });
        console.log({ existingDefault });
        if (existingDefault) {
          await tx
            .update(variable)
            .set({ default: false })
            .where(eq(variable.id, existingDefault.id));
        }
        return await tx
          .update(variable)
          .set({ default: true })
          .where(eq(variable.id, input.id))
          .returning();
      });
    }),

  insert: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        tokens: z.array(
          z.object({
            key: z.string(),
            value: z.string(),
            provider: z.custom<ProviderType>(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        for (const token of input.tokens) {
          const defaultToken = await tx.query.variable.findFirst({
            where: (variable, { eq, and }) =>
              and(
                eq(variable.project_id, input.projectId),
                eq(variable.provider, token.provider),
                eq(variable.default, true),
              ),
          });

          await ctx.db
            .insert(variable)
            .values({
              ...token,
              default: defaultToken ? false : token.provider !== "OTHER",
              project_id: input.projectId,
            })
            .returning();
        }
      });
    }),
});
