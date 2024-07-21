import fs from "node:fs/promises";
import { eq } from "drizzle-orm";
import ky from "ky";

import { organizations } from "../drizzle/schema";
import { buildDbClient } from "./client";

const turso = ky.create({
  prefixUrl: `${process.env.TURSO_API_URL}/v1/organizations/${process.env.TURSO_APP_ORGANIZATION}/`,
  headers: {
    Authorization: `Bearer ${process.env.TURSO_API_TOKEN}`,
  },
});

type OrgId = `org-${string}`;

const orgDatabaseName = (organizationId: OrgId) =>
  `${process.env.APP_NAME}-${organizationId}`;

export async function createOrganizationDatabase(organization: { id: OrgId }) {
  // create a database for organization
  const orgDatabase = await turso
    .post(`/databases`, {
      json: {
        name: orgDatabaseName(organization.id),
        group: `${process.env.APP_GROUP}`,
        location: `${process.env.APP_PRIMARY_LOCATION}`,
      },
    })
    .json<{
      database: { Hostname: string; DbId: string; Name: string };
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

  await pushToOrgDb({
    dbName: orgDatabase.database.Name,
    authToken: jwt,
  });
}

export async function pushToOrgDb({
  dbName,
  authToken,
  input,
}: {
  dbName: string;
  authToken: string;
  input?: boolean;
}) {
  const tempConfigPath = "./src/db/tenant/drizzle.config.ts";

  const configText = `
  export default {
    schema: "./src/db/tenant/schema/index.ts",
    driver: "turso",
    dbCredentials: {
      url: "libsql://${dbName}-${process.env.APP_NAME}.turso.io",
      authToken: "${authToken}",
    },
    tablesFilter: ["!libsql_wasm_func_table"],
  }`;

  await Bun.write(tempConfigPath, configText);

  return new Promise((resolve, reject) => {
    const proc = Bun.spawn(
      ["bunx", "drizzle-kit", "push:sqlite", `--config=${tempConfigPath}`],
      {
        stdout: input ? "inherit" : undefined,
        stdin: input ? "inherit" : undefined,
        async onExit(subprocess, exitCode, signalCode, error) {
          await fs.unlink(tempConfigPath);
          if (exitCode === 0) {
            resolve(void 0);
          } else {
            console.error("Error pushing to tenant db");
            reject(error);
          }
        },
      },
    );
  });
}
