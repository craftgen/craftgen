import { helloRouter } from "./router/hello.ts";
import { createTRPCRouter } from "./trpc.ts";

export const appRouter = createTRPCRouter({
  hello: helloRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
