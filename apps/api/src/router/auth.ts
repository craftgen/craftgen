import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      return null;
    }
    const user = await ctx.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, ctx.session?.user.id!),
      columns: {
        email: true,
        fullName: true,
        username: true,
        avatar_url: true,
      },
    });
    return {
      ...user,
      ...ctx.session,
    };
  }),
  getSecretMessage: protectedProcedure.query(() => {
    // testing type validation of overridden next-auth Session in @acme/auth package
    return "you can see this secret message!";
  }),
  getCurrentTeam: protectedProcedure.query(({ ctx }) => {}),
  setTeam: protectedProcedure.mutation(({ ctx, input }) => {}),
});
