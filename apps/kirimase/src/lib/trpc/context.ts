import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getUserAuth } from "../auth/utils";

export async function createContext(opts?: FetchCreateContextFnOptions) {
const { session } = await getUserAuth();

  return {
     session: session,
    headers: opts && Object.fromEntries(opts.req.headers),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
