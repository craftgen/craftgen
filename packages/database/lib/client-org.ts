import { Schema } from "@effect/schema";
import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql";
import { Cache, Context, Effect } from "effect";

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
      url: `libsql://${url}`,
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
    id: Schema.String,
    authToken: Schema.String, // TODO: Redacted
  },
) {
  client() {
    return tenantDbClient({
      url: `libsql://${this.id}.db`,
      authToken: this.authToken,
    });
  }
}

const make = Effect.gen(function* () {
  const connections = yield* Cache.make({
    capacity: 64,
    timeToLive: "30 minutes",
    lookup: (tenant: Tenant) => Effect.sync(() => tenant.client()),
  });

  return {
    for: (t: Tenant) => connections.get(t),
  };
});

export class Databases extends Context.Tag("services/Databases")<
  Databases,
  Effect.Effect.Success<typeof make>
>() {}

export const getTenantDbClient = (
  tenantId: string,
  authToken: string,
): Effect.Effect<TenantDbClient, never, Databases> =>
  Effect.gen(function* (_) {
    const databases = yield* _(Databases);
    const tenant = new Tenant({ id: tenantId, authToken });
    return yield* _(databases.for(tenant));
  });
