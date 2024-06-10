import { TRPCError } from "@trpc/server";
import { match } from "ts-pattern";
import { z } from "zod";

import { eq, schema } from "@craftgen/db/db";

import { BASE_URL } from "../../constants";
import { stripe } from "../../stripe";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const stripeConnectRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.project.findFirst({
        where: (p, { eq }) => eq(p.id, input.projectId),
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      if (!project.stripeAccountId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Stripe account not found for project`,
        });
      }
      return stripe.accounts.retrieve(project.stripeAccountId!);
    }),
  create: protectedProcedure
    .input(
      z.object({
        projectSlug: z.string(),
        type: z.enum(["standard", "express"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.query.project.findFirst({
        where: (p, { eq }) => eq(p.slug, input.projectSlug),
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      if (project.slug !== ctx.session.user.user_metadata.currentProjectSlug) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You don't have access to this project`,
        });
      }

      // ctx.session.user.user_metadata.currentProjectSlug
      return await ctx.db.transaction(async (tx) => {
        const account = await match(input.type)
          .with("express", async () => {
            return await stripe.accounts.create({
              type: "express",
              metadata: {
                projectId: project.id,
                projectSlug: project.slug,
                personal: String(project.personal),
              },
            });
          })
          .with("standard", async () => {
            return await stripe.accounts.create({
              type: "standard",
              metadata: {
                projectId: project.id,
                projectSlug: project.slug,
                personal: String(project.personal),
              },
            });
          })
          .run();

        const p = await tx
          .update(schema.project)
          .set({
            stripeAccountId: account.id,
          })
          .where(eq(schema.project.id, project.id))
          .returning();

        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: "https://example.com/reauth",
          return_url: `${BASE_URL}/${project.slug}/settings/payment?confetti`,
          type: "account_onboarding",
        });

        return {
          accountId: account.id,
          project: p,
          accountLink,
        };
      });
    }),
});
