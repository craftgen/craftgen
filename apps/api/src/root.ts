import { authRouter } from "./router/auth";
import { craftRouter } from "./router/craft";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  craft: craftRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
