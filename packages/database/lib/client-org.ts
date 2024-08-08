import { createClient } from "npm:@libsql/client/http";
import { drizzle } from "npm:drizzle-orm/libsql";

import * as schema from "../tenant/schema/index.ts";

interface Env {
  url: string;
  authToken?: string;

  useLocalReplica?: boolean;
}

export function buildDbClient({ url, authToken }: Env) {
  if (url === undefined) {
    throw new Error("db url is not defined");
  }

  // const authToken = (process.env as unknown as Env).TURSO_DB_AUTH_TOKEN?.trim();
  if (authToken === undefined) {
    throw new Error("TURSO_DB_AUTH_TOKEN is not defined");
  }
  return drizzle(
    createClient({
      url: `libsql://${url}`,
      authToken,
    }),
    {
      schema,
    },
  );
}
