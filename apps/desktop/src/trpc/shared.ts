import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";

import type { AppRouter } from "@craftgen/api";

export const transformer = superjson;

function getBaseUrl() {
  console.log("VITE_BACKEND_URL", import.meta.env.VITE_BACKEND_URL);
  return import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";
  // return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
