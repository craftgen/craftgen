import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { createCaller, createTRPCContext } from "@craftgen/api";
import type { Database } from "@craftgen/db/db/database.types";

// import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const session = await supabase.auth.getSession();

  return createTRPCContext({
    headers: heads,
    auth: session.data.session,
  });
});

export const api = createCaller(createContext);
