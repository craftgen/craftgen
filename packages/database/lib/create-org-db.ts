import { createClient } from "@tursodatabase/api";
import { eq } from "drizzle-orm";
import { parse } from "https://deno.land/std@0.200.0/flags/mod.ts";

import { platform } from "../mod.ts";
import { tenantDbClient } from "./client-org.ts";
import { platformDbClient } from "./client.ts";

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
    group: `${Deno.env.get("APP_GROUP")}`,
  });

  const { jwt } = await turso.databases.createToken(orgDatabase.name, {
    authorization: "full-access",
  });

  const pDb = platformDbClient();
  await pDb
    .update(platform.organization)
    .set({
      database_name: orgDatabase.name,
      database_auth_token: jwt,
    })
    .where(eq(platform.organization.id, params.id));
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

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const { orgId, authToken } = parse(Deno.args, {
    string: ["orgId", "authToken"],
  });

  if (!orgId || !authToken) {
    console.error("orgId and authToken are required");
    Deno.exit(1);
  }

  // check if orgId is a valid orgId
  if (!orgId.startsWith("org-")) {
    console.error("orgId is not a valid orgId");
    Deno.exit(1);
  }

  await createConfigFile({ orgId: orgId as OrgId, authToken });
}
