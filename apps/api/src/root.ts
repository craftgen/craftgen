import { authRouter } from "./router/auth";
import { craftRouter } from "./router/craft";
import { openaiRouter } from "./router/openai";
import { projectRouter } from "./router/project";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  project: projectRouter,
  craft: craftRouter,
  openai: openaiRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
