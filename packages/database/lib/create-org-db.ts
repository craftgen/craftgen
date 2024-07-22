import fs from "node:fs/promises";
import { eq } from "drizzle-orm";
import ky from "ky";

import { organizations } from "../primary/schema.ts";
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

export async function createOrganizationDatabase(organization: { id: OrgId }) {
  // create a database for organization
  const orgDatabase = await turso
    .post(`/databases`, {
      json: {
        name: orgDatabaseName(organization.id),
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
    .update(organizations)
    .set({
      database_name: orgDatabase.database.Name,
      database_auth_token: jwt,
    })
    .where(eq(organizations.id, organization.id));

  // await pushToOrgDb({
  //   dbName: orgDatabase.database.Name,
  //   authToken: jwt,
  // });
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
  const tempConfigPath = "../tenant/drizzle.config.ts";

  const configText = `
  export default {
    schema: "./schema/index.ts",
    driver: "turso",
    dialect: "sqlite",
    dbCredentials: {
      url: "libsql://${orgDatabaseName(dbName)}.turso.io",
      authToken: "${authToken}",
    },
    tablesFilter: ["!libsql_wasm_func_table"],
  }`;

  await Deno.writeTextFile(tempConfigPath, configText);

  const proc = new Deno.Command("bunx", {
    cwd: "../tenant",
    args: ["drizzle-kit", "push", `--config=${tempConfigPath}`],
    stdout: "inherit",
    stdin: "inherit",
  });
  const migration = proc.spawn();

  const { code, success } = await migration.output();
  await Deno.remove(tempConfigPath);
  if (success) {
    console.log("Migration successful");
  } else {
    console.error("Migration failed");
    Deno.exit(code);
  }
}

const token =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MjE2MTgwMzEsImlkIjoiN2NiMTRkN2MtODVjYy00NWUyLWEwNTctOTA5OGJkZGQ4MTY4In0.HXvTbW-5N6Z9b6PE8I3HfugXLou0lvS0HJ7_pXiaxE6fveyycIUJf6zsMo0_gtOlr7K9-trO74pmqMKSs1GGBw";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await pushToOrgDb({
    dbName: "org-123",
    authToken: token,
  });
}
