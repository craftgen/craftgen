import { authRouter } from "./router/auth";
import { craftRouter } from "./router/craft";
import { credentialsRouter } from "./router/creadentials";
import { googleRouter } from "./router/google";
import { openaiRouter } from "./router/openai";
import { projectRouter } from "./router/project";
import { publicRouter } from "./router/public";
import { replicateRouter } from "./router/replicate";
import { stripeRouter } from "./router/stripe";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  project: projectRouter,
  craft: craftRouter,
  openai: openaiRouter,
  google: googleRouter,
  replicate: replicateRouter,
  credentials: credentialsRouter,
  stripe: stripeRouter,
  public: publicRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
