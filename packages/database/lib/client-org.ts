import { Schema } from "@effect/schema";
import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql";
import { Effect } from "effect";

import type { TenantDbClient } from "../mod.ts";
import * as schema from "../tenant/schema/index.ts";

interface Env {
  url: string;
  authToken?: string;

  useLocalReplica?: boolean;
}

export function tenantDbClient({ url, authToken }: Env): TenantDbClient {
  if (url === undefined) {
    throw new Error("db url is not defined");
  }

  // const authToken = (process.env as unknown as Env).TURSO_DB_AUTH_TOKEN?.trim();
  if (authToken === undefined) {
    throw new Error("TURSO_DB_AUTH_TOKEN is not defined");
  }

  return drizzle(
    createClient({
      url: url,
      authToken,
    }),
    {
      schema,
    },
  );
}

export class Tenant extends Schema.TaggedClass<Tenant>("Databases/Tenant")(
  "Tenant",
  {
    url: Schema.String,
    authToken: Schema.String, // TODO: Redacted
  },
) {
  client() {
    return tenantDbClient({
      url: this.url,
      authToken: this.authToken,
    });
  }
}

// Updated getTenantDbClient function
export const getTenantDbClient = ({
  url,
  authToken,
}: {
  url: string;
  authToken: string;
}): Effect.Effect<TenantDbClient, never, never> =>
  Effect.gen(function* (_) {
    const tenant = new Tenant({ url, authToken });
    return tenant.client();
  });
