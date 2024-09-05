import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { appRouter, type AppRouter } from "./router/index.ts";
import { tenantRouter } from "./router/tenant/index.ts";
import {
  Context,
  createCallerFactory,
  createTRPCContextforTenant,
} from "./trpc.ts";

export { createTRPCContext } from "./trpc.ts";

export type { AppRouter };
export { appRouter };
/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

export const tenantCaller = createCallerFactory(tenantRouter);

export const createCallerForTenant = async (
  tenantSlug: string,
  ctx: Context,
) => {
  return tenantCaller(
    await createTRPCContextforTenant({
      tenantSlug,
      ...ctx,
    }),
  );
};
/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>;
