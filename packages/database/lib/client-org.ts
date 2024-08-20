import { Context, Effect } from "effect";
import { createClient } from "npm:@libsql/client/http";
import { drizzle } from "npm:drizzle-orm/libsql";

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

export class TenantDBConfig extends Context.Tag("TenantDBConfig")<
  TenantDBConfig,
  {
    readonly getConfig: Effect.Effect<{
      readonly url: string;
      readonly authToken: string;
    }>;
  }
>() {}

export class TenantDb extends Context.Tag("TenantDb")<
  TenantDb,
  { readonly tDb: TenantDbClient }
>() {
  static live = () =>
    Effect.gen(function* (_) {
      const config = yield* _(TenantDBConfig);
      const { url, authToken } = yield* _(config.getConfig);
      return { tDb: tenantDbClient({ url, authToken }) };
    });
}
