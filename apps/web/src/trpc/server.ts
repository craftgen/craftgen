import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";

import { createCaller, createTRPCContext } from "@craftgen/ipc-api";

// import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
    auth: auth(),
  });
});

export const api = createCaller(createContext, {
  onError: ({ error }) => {
    console.log("ERROR", error);
  },
});
