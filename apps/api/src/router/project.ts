import { z } from "zod";

import { desc, eq } from "@seocraft/supabase/db";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

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
  bySlug: publicProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.project.findFirst({
        where: (p, { eq }) => eq(p.slug, input.projectSlug),
      });
    }),

  // byId: publicProcedure
  //   .input(z.object({ id: z.number() }))
  //   .query(({ ctx, input }) => {
  //     // return ctx.db
  //     //   .select()
  //     //   .from(schema.post)
  //     //   .where(eq(schema.post.id, input.id));

  //     return ctx.db.query.post.findFirst({
  //       where: eq(schema.post.id, input.id),
  //     });
  //   }),

  // create: protectedProcedure
  //   .input(
  //     z.object({
  //       title: z.string().min(1),
  //       content: z.string().min(1),
  //     }),
  //   )
  //   .mutation(({ ctx, input }) => {
  //     return ctx.db.insert(schema.post).values(input);
  //   }),

  // delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
  //   return ctx.db.delete(schema.post).where(eq(schema.post.id, input));
  // }),
});
