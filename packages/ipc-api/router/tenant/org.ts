import { TRPCError } from "@trpc/server";
import { isNil } from "lodash-es";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc.ts";

export const orgRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.tenantDb.query.organization.findMany({
        where: (project, { or, ilike }) =>
          or(
            ilike(project.name, `%${input.query}%`),
            ilike(project.slug, `%${input.query}%`),
          ),
        limit: 10,
      });
    }),
  checkSlugAvailable: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const exist = await ctx.tenantDb.query.workflow.findFirst({
        where: (workflow, { and, eq }) =>
          and(
            eq(workflow.slug, input.slug),
            eq(workflow.organizationId, input.organizationId),
          ),
        columns: {
          slug: true,
        },
      });
      return isNil(exist);
    }),
  all: publicProcedure.query(({ ctx }) => {
    return ctx.tenantDb.query.organization.findMany({});
  }),
  userProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.tenantDb.query.organizationMembers.findMany({
      where: (orgMembers, { eq }) =>
        eq(orgMembers.userId, ctx.session.user?.id),
      with: {
        organization: true,
      },
    });
  }),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.tenantDb.query.organization.findFirst({
        where: (p, { eq }) => eq(p.id, input.id),
      });
    }),
  bySlug: publicProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("input", input, ctx);

      const org = await ctx.tDb.query.organization.findFirst({
        where: (p, { eq }) => eq(p.slug, input.projectSlug),
        columns: {
          name: true,
          slug: true,
          personal: true,
          id: true,
        },
      });
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      return org;
    }),
});
