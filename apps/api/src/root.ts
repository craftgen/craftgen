import { authRouter } from "./router/auth";
import { craftRouter } from "./router/craft";
import { googleRouter } from "./router/google";
import { openaiRouter } from "./router/openai";
import { projectRouter } from "./router/project";
import { replicateRouter } from "./router/replicate";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  project: projectRouter,
  craft: craftRouter,
  openai: openaiRouter,
  google: googleRouter,
  replicate: replicateRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
