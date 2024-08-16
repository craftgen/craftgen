import fs from "node:fs/promises";
import { eq, or } from "drizzle-orm";
import ky from "ky";

import { organization } from "../primary/schema.ts";
import { buildDbClient } from "./client.ts";

const turso = ky.create({
  prefixUrl: `${Deno.env.get("TURSO_API_URL")}/v1/organizations/${Deno.env.get("TURSO_APP_ORGANIZATION")}/`,
  headers: {
    Authorization: `Bearer ${Deno.env.get("TURSO_API_TOKEN")}`,
  },
});

type OrgId = `org-${string}`;
type OrgDBName = `${OrgId}-${string}`;

const orgDatabaseName = (organizationId: OrgId): OrgDBName =>
  `${organizationId}-${Deno.env.get("APP_NAME")}`;

export async function createOrganizationDatabase(params: { id: OrgId }) {
  // create a database for organization
  const orgDatabase = await turso
    .post(`/databases`, {
      json: {
        name: orgDatabaseName(params.id),
        group: `${Deno.env.get("APP_GROUP")}`,
        location: `${Deno.env.get("APP_PRIMARY_LOCATION")}`,
      },
    })
    .json<{
      database: { Hostname: string; DbId: string; Name: OrgDBName };
    }>();

  // create an authentication token
  const { jwt } = await turso
    .post(`/databases/${orgDatabase.database.Name}/auth/tokens`)
    .json<{ jwt: string }>();

  const db = buildDbClient();
  await db
    .update(organization)
    .set({
      database_name: orgDatabase.database.Name,
      database_auth_token: jwt,
    })
    .where(eq(organization.id, params.id));

  // await pushToOrgDb({
  //   dbName: orgDatabase.database.Name,
  //   authToken: jwt,
  // });
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

export async function pushToOrgDb({
  dbName,
  authToken,
  input,
}: {
  dbName: OrgId;
  authToken: string;
  input?: boolean;
}) {
  const tempConfigPath = await createConfigFile({
    orgId: dbName,
    authToken,
  });

  const proc = new Deno.Command("bunx", {
    // cwd: "./tenant",
    args: ["drizzle-kit", "push", `--config=${tempConfigPath}`],
    stdout: "inherit",
    stdin: "inherit",
  });
  const migration = proc.spawn();

  const { code, success } = await migration.output();
  // await Deno.remove(tempConfigPath);
  if (success) {
    console.log("Migration successful");
  } else {
    console.error("Migration failed");
    Deno.exit(code);
  }
}

const token =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MjE4ODUzNzgsImlkIjoiMjA5ZDQ5YzEtNzg2Zi00MTI1LTkyMjQtMmIxODJlYjI1NjY1In0.qNRpKqXB-MHgB_n0-LIWbHhpXJZQR4WIP5pxiVtPTeSj-VF3xMSbwWvjhwuv1lo7VrS_ZVphEnQt3EZITbcNDQ";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await pushToOrgDb({
    dbName: "org-123",
    authToken: token,
  });
}
