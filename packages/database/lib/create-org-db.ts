import { createClient } from "@tursodatabase/api";

type OrgId = `org-${string}`;
type OrgDBName = `${OrgId}-${string}`;

const ORG_SCHEMA_NAME = "org-root";

const orgDatabaseName = (organizationId: OrgId): OrgDBName =>
  `${organizationId}-${Deno.env.get("APP_NAME")}`;

export async function createOrganizationDatabase(params: { id: OrgId }) {
  const turso = createClient({
    token: Deno.env.get("TURSO_API_TOKEN")!,
    org: Deno.env.get("TURSO_APP_ORGANIZATION")!,
  });
  // create a database for organization
  const orgDatabase = await turso.databases.create(orgDatabaseName(params.id), {
    schema: ORG_SCHEMA_NAME,
    group: `${Deno.env.get("TURSO_TENANT_GROUP")}`,
  });

  const { jwt } = await turso.databases.createToken(orgDatabase.name, {
    authorization: "full-access",
  });

  return {
    orgId: params.id,
    authToken: jwt,
  };
}

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
