import { createClient } from "npm:@libsql/client/node";
import { drizzle } from "npm:drizzle-orm/libsql";

import * as schema from "../tenant/schema/index.ts";

interface Env {
  url: string;
  authToken?: string;

  useLocalReplica?: boolean;
}

const extractOrgId = (url: string): string | null => {
  const regex = /libsql:\/\/(org-[a-zA-Z0-9]+)-/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

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
    const filePath = `file:${Deno.env.get("DB_LOCATION") || "./db/"}${extractOrgId(url)}.db`;
    console.log("@".repeat(100));
    console.log("FILE PATH", filePath);
    console.log("URL", url);
    console.log("@".repeat(100));
    const a = createClient({
      url: filePath,
      syncUrl: url,
      authToken,
      syncInterval: 60,
    });
    console.log("DB", a);
    console.log("");
    return {
      client: a,
      db: drizzle(a, {
        schema,
      }),
    };
  }
  const client = createClient({
    url: url,
    authToken,
  });
  const db = drizzle(client, {
    schema,
  });
  return {
    client,
    db,
  };
}
