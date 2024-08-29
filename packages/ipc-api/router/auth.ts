import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc.ts";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth) {
      return null;
    }

    // const user = await ctx.db.query.user.findFirst({
    //   where: (user, { eq }) => eq(user.id, ctx.auth?.user.id!),
    //   columns: {
    //     email: true,
    //     fullName: true,
    //     username: true,
    //     avatar_url: true,
    //   },
    // });

    return {
      ...ctx.auth,
      // ...user,
      // ...ctx.session,
      // currentProjectSlug: ctx.session.user?.user_metadata.currentProjectSlug,
    };
  }),
  getSecretMessage: protectedProcedure.query(() => {
    // testing type validation of overridden next-auth Session in @acme/auth package
    return "you can see this secret message!";
  }),
});
