import { appRouter } from "./router/index.ts";
import { createCallerFactory } from "./trpc.ts";

export { createTRPCContext } from "./trpc.ts";

export { type AppRouter } from "./router/index.ts";
export { appRouter };
export const createCaller = createCallerFactory(appRouter);
