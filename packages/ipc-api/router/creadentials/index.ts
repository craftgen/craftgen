import { isNil } from "lodash-es";
import { z } from "zod";

import { eq, sql, tenant } from "@craftgen/database";

import { createTRPCRouter, protectedProcedure } from "../../trpc.ts";

type ProviderType = "OPENAI" | "REPLICATE" | "OTHER";

export const credentialsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        provider: z.custom<ProviderType>().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.user_metadata.currentProjectSlug) {
        return [];
      }
      return await ctx.db.transaction(async (tx) => {
        const organization = await tx.query.organization.findFirst({
          where: (org, { eq }) =>
            eq(org.slug, ctx.session.user.user_metadata.currentProjectSlug),
        });
        if (!organization) {
          return [];
        }
        return await ctx.db.query.variable.findMany({
          where: (token, { eq, and }) =>
            and(
              eq(token.organizationId, organization?.id),
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
        organizationId: z.string(),
        provider: z.custom<ProviderType>(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const credentials = await ctx.db.query.variable.findFirst({
        where: (token, { eq, and }) =>
          and(
            eq(token.organizationId, input.organizationId),
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
      return await ctx.db
        .delete(tenant.variable)
        .where(eq(tenant.variable.id, input.id));
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
        .update(tenant.variable)
        .set({ key: input.key, value: input.value })
        .where(eq(tenant.variable.id, input.id))
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
          where: (v, { eq, and }) =>
            and(
              eq(v.organizationId, token.organizationId),
              !isNil(token.provider)
                ? eq(v.provider, token.provider)
                : undefined,
              eq(v.default, true),
            ),
        });
        console.log({ existingDefault });
        if (existingDefault) {
          await tx
            .update(tenant.variable)
            .set({ default: false })
            .where(eq(tenant.variable.id, existingDefault.id));
        }
        return await tx
          .update(tenant.variable)
          .set({ default: true })
          .where(eq(tenant.variable.id, input.id))
          .returning();
      });
    }),

  insert: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
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
            where: (v, { eq, and }) =>
              and(
                eq(v.organizationId, input.organizationId),
                eq(v.provider, token.provider),
                eq(v.default, true),
              ),
          });

          await ctx.db
            .insert(tenant.variable)
            .values({
              ...token,
              default: defaultToken ? false : token.provider !== "OTHER",
              organizationId: input.organizationId,
            })
            .returning();
        }
      });
    }),
});
