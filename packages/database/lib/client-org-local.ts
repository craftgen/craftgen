import { createClient } from "npm:@libsql/client/node";
import { drizzle } from "npm:drizzle-orm/libsql";

import * as schema from "../tenant/schema/index.ts";

interface Env {
  url: string;
  authToken?: string;

  useLocalReplica?: boolean;
}

export function buildDbClient({
  url,
  authToken,
  useLocalReplica = false,
}: Env) {
  if (url === undefined) {
    throw new Error("db url is not defined");
  }

  // const authToken = (process.env as unknown as Env).TURSO_DB_AUTH_TOKEN?.trim();
  if (authToken === undefined) {
    throw new Error("TURSO_DB_AUTH_TOKEN is not defined");
  }
  if (useLocalReplica) {
    const filePath = `file:${Deno.env.get("SERVICE_BASE_DIR") ? `${Deno.env.get("SERVICE_BASE_DIR")}/` : ""}org.db`;
    console.log("@".repeat(100));
    console.log("FILE PATH", filePath);
    console.log("@".repeat(100));
    const a = createClient({
      url: filePath,
      syncUrl: `libsql://${url}`,
      authToken,
    });
    console.log("DB", a);
    console.log("");

    return drizzle(a, {
      schema,
    });
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
