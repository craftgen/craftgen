import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { TenantDbClient } from "../database/mod.ts";
import { appRouter, type AppRouter } from "./router/index.ts";
import { tenantRouter } from "./router/tenant/index.ts";
import {
  createCallerFactory,
  createTRPCContextforTenant,
  type Context,
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

export const createCallerForTenant = async ({
  ctx,
  ...args
}: {
  tenantSlug?: string;
  tenantId?: string;
  tenantDb?: TenantDbClient;
  ctx: Context;
}) => {
  return tenantCaller(
    await createTRPCContextforTenant({
      ...args,
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
