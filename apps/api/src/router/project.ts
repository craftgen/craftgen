import { TRPCError } from "@trpc/server";
import { isNil } from "lodash-es";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.project.findMany({
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
      const exist = await ctx.db.query.workflow.findFirst({
        where: (workflow, { and, eq }) =>
          and(
            eq(workflow.slug, input.slug),
            eq(workflow.projectId, input.projectId),
          ),
        columns: {
          slug: true,
        },
      });
      return isNil(exist);
    }),
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.project.findMany({});
  }),
  userProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.projectMembers.findMany({
      where: (projectMembers, { eq }) =>
        eq(projectMembers.userId, ctx.session.user?.id),
      with: {
        project: true,
      },
    });
  }),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.project.findFirst({
        where: (p, { eq }) => eq(p.id, input.id),
      });
    }),
  bySlug: publicProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.project.findFirst({
        where: (p, { eq }) => eq(p.slug, input.projectSlug),
        columns: {
          name: true,
          slug: true,
          personal: true,
          id: true,
          stripeAccountId: true,
        },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project?.personal) {
        const projectMembers = await ctx.db.query.projectMembers.findFirst({
          where: (projectMembers, { eq }) =>
            eq(projectMembers.projectId, project.id),
          with: {
            user: {
              columns: {
                avatar_url: true,
              },
            },
          },
        });
        return {
          ...project,
          avatar_url: projectMembers?.user.avatar_url,
        };
      }
      return {
        ...project,
        avatar_url: null,
      };
    }),
});
