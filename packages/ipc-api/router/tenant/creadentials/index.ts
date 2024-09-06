import { isNil } from "lodash-es";
import { z } from "zod";

import { eq, sql, tenant } from "@craftgen/database";

import { createTRPCRouter, protectedProcedure } from "../../../trpc.ts";

type ProviderType = "OPENAI" | "REPLICATE" | "OTHER";

export const credentialsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        provider: z.custom<ProviderType>().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.tDb.transaction(async (tx) => {
        return await tx.query.variable.findMany({
          where: (token, { eq, and }) =>
            and(
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
        provider: z.custom<ProviderType>(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const credentials = await ctx.tDb.query.variable.findFirst({
        where: (token, { eq, and }) => and(eq(token.provider, input.provider)),
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
      return await ctx.tDb
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
      return await ctx.tDb
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
      const token = await ctx.tDb.query.variable.findFirst({
        where: (variable, { eq }) => eq(variable.id, input.id),
      });
      if (!token) {
        throw new Error("Variable not found");
      }
      if (token.provider === "OTHER") {
        throw new Error("Cannot set default for OTHER provider");
      }
      await ctx.tDb.transaction(async (tx) => {
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
      await ctx.tDb.transaction(async (tx) => {
        for (const token of input.tokens) {
          const defaultToken = await tx.query.variable.findFirst({
            where: (v, { eq, and }) =>
              and(
                eq(v.organizationId, ctx.auth.sessionClaims.orgId as string),
                eq(v.provider, token.provider),
                eq(v.default, true),
              ),
          });

          await ctx.tDb
            .insert(tenant.variable)
            .values({
              organizationId: ctx.auth.sessionClaims.orgId as string,
              ...token,
              default: defaultToken ? false : token.provider !== "OTHER",
            })
            .returning();
        }
      });
    }),
});
