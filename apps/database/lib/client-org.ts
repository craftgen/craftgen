import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "../drizzle/org-schema";

interface Env {
  url: string;
  TURSO_DB_AUTH_TOKEN?: string;
}

export function buildDbClient({ url }: Env) {
  if (url === undefined) {
    throw new Error("db url is not defined");
  }

  const authToken = (process.env as unknown as Env).TURSO_DB_AUTH_TOKEN?.trim();
  if (authToken === undefined) {
    throw new Error("TURSO_DB_AUTH_TOKEN is not defined");
  }

  return drizzle(createClient({ url: `libsql://${url}`, authToken }), {
    schema,
  });
}
