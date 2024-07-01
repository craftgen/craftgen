import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { createCaller, createTRPCContext } from "@craftgen/api";

import { createClient } from "@/utils/supabase/server";

// import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");
  const supabase = createClient();
  const session = await supabase.auth.getSession();

  return createTRPCContext({
    headers: heads,
    auth: session.data.session,
  });
});

export const api = createCaller(createContext, {
  onError: ({ error }) => {
    console.log("ERROR", error);
  },
});
