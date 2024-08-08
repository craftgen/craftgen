import { createClient } from "npm:@libsql/client/node";
import { drizzle, type LibSQLDatabase } from "npm:drizzle-orm/libsql";

import { EventProcessor } from "../tenant/queue.ts";
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

export type TenantDb = LibSQLDatabase<typeof schema>;
export type DbClient = {
  db: TenantDb;
  client: ReturnType<typeof createClient>;
  queue: EventProcessor;
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
    const db = drizzle(a, {
      schema,
    });
    const queue = new EventProcessor(db);
    return {
      client: a,
      db,
      queue,
    };
  }
  const client = createClient({
    url: url,
    authToken,
  });
  const db = drizzle(client, {
    schema,
  });
  const queue = new EventProcessor(db, {
    lockDuration: 10, // 90 seconds
    maxConcurrentMachines: 5,
    cleanupInterval: 600000, // 10 minutes
    pollingInterval: 5000, // 1 second
  });
  return {
    client,
    db,
    queue,
  };
}
