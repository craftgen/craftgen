import { z } from "zod";

import { desc, eq } from "@seocraft/supabase/db";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({
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
