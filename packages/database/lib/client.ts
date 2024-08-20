import { Config, Context, Effect, Layer, Option } from "effect";
import { createClient } from "npm:@libsql/client/http";
import { drizzle } from "npm:drizzle-orm/libsql";

import type { PlatformDbClient } from "../mod.ts";
import * as schema from "../primary/schema/index.ts";

interface Env {
  TURSO_DB_AUTH_TOKEN?: string;
  TURSO_DB_URL?: string;
}

// export type PlatformDbClient = LibSQLDatabase<typeof schema>;

class TursoDbAuthTokenMissingError extends Error {
  readonly _tag = "TursoDbAuthTokenMissingError";
  constructor() {
    super("TURSO_DB_AUTH_TOKEN is not defined");
  }
}

const TursoConfig = Config.all({
  url: Config.string("TURSO_DB_URL"),
  authToken: Config.redacted("TURSO_DB_AUTH_TOKEN").pipe(Config.option),
});

const createPlatformDbClient = Effect.gen(function* (_) {
  const config = yield* _(TursoConfig);

  const isFile = config.url.includes("file:");

  if (isFile) {
    return drizzle(createClient({ url: config.url }), { schema });
  }

  const token = Option.getOrThrowWith(
    config.authToken,
    () => new TursoDbAuthTokenMissingError(),
  );

  return drizzle(createClient({ url: config.url, authToken: token }), {
    schema,
  });
});

export class PlatformDb extends Context.Tag("PlatformDb")<
  PlatformDb,
  { readonly pDb: PlatformDbClient }
>() {}

export const PlatformDbLive = Layer.effect(
  PlatformDb,
  Effect.gen(function* (_) {
    return { pDb: yield* _(createPlatformDbClient) };
  }),
);
