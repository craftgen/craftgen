import { Schema } from "@effect/schema";
import { createClient } from "@tursodatabase/api";
import { Config, Context, Data, Effect, Layer } from "effect";

type OrgId = `org-${string}`;
type UserId = `user-${string}`;
type OrgDBName = `${OrgId}-${string}` | `${UserId}-${string}`;

const ORG_SCHEMA_NAME = Config.string("TURSO_TENANT_DB_NAME");
const TENANT_GROUP = Config.string("TURSO_TENANT_GROUP")!;
const APP_ORGANIZATION = Config.string("TURSO_APP_ORGANIZATION")!;

export const orgDatabaseName = (organizationId: OrgId | UserId) =>
  Effect.gen(function* (_) {
    const appOrg = yield* APP_ORGANIZATION;
    return `${organizationId}-${appOrg}`;
  });

export class TursoClient extends Context.Tag("TursoClient")<
  TursoClient,
  ReturnType<typeof createClient>
>() {
  static Live = () =>
    Layer.effect(
      TursoClient,
      Effect.gen(function* (_) {
        const token = yield* Config.string("TURSO_API_TOKEN")!;
        const org = yield* Config.string("TURSO_APP_ORGANIZATION")!;
        return createClient({
          token,
          org,
        });
      }),
    );
}

class DatabaseAlreadyExistsError extends Data.TaggedError(
  "DatabaseAlreadyExistsError",
)<{
  readonly message: string;
  readonly orgId: OrgId | UserId;
}> {}

class DatabaseQuotaExceededError extends Data.TaggedError(
  "DatabaseQuotaExceededError",
)<{
  readonly message: string;
  readonly orgId: OrgId | UserId;
}> {}

class DatabaseCreationError extends Data.TaggedError("DatabaseCreationError")<{
  readonly message: string;
  readonly orgId: OrgId | UserId;
  readonly cause: unknown;
}> {}

export const createOrganizationDatabase = (params: { orgId: OrgId | UserId }) =>
  Effect.gen(function* (_) {
    const turso = yield* _(TursoClient);
    const schema = yield* _(ORG_SCHEMA_NAME);
    const group = yield* _(TENANT_GROUP);
    const databaseName = params.orgId;
    const orgDatabase = yield* _(
      Effect.tryPromise({
        try: () =>
          turso.databases.create(databaseName, {
            schema,
            group,
          }),
        catch: (error) => {
          Effect.logError(`Creating database ${databaseName} failed`);
          if (error instanceof Error) {
            if (error.message.includes("already exists")) {
              throw new DatabaseAlreadyExistsError({
                message: `Database for organization ${params.orgId} already exists ${databaseName}`,
                orgId: params.orgId,
              });
            }
            if (error.message.includes("quota exceeded")) {
              throw new DatabaseQuotaExceededError({
                message: "Database quota exceeded",
                orgId: params.orgId,
              });
            }
          }
          throw new DatabaseCreationError({
            message: `Failed to create database [${databaseName}]`,
            orgId: params.orgId,
            cause: error,
          });
        },
      }),
    );

    const { jwt } = yield* _(
      Effect.tryPromise(() =>
        turso.databases.createToken(orgDatabase.name, {
          authorization: "full-access",
        }),
      ),
    );

    return {
      orgDatabase,
      orgId: params.orgId,
      authToken: jwt,
    };
  });

export async function createConfigFile({
  orgId,
  authToken,
}: {
  orgId: OrgId;
  authToken: string;
}) {
  const configPath = "./tenant/drizzle.config.ts";
  const configText = `
  export default {
    schema: "./tenant/schema/index.ts",
    driver: "turso",
    dialect: "sqlite",
    out: "./tenant/drop",
    dbCredentials: {
      url: "libsql://${orgId}-${Deno.env.get("APP_NAME")}.turso.io",
      authToken: "${authToken}",
    },
    tablesFilter: ["!libsql_wasm_func_table"],
  }`;

  await Deno.writeTextFile(configPath, configText);
  return configPath;
}
