import { defineConfig } from "drizzle-kit";

console.log("CRRED", {
  TURSO_TENANT_DB_URL: process.env.TURSO_TENANT_DB_URL,
  TURSO_TENANT_GROUP_AUTH_TOKEN: process.env.TURSO_TENANT_GROUP_AUTH_TOKEN,
});

export default defineConfig({
  schema: "./tenant/schema/index.ts",
  out: "./tenant/migrations",
  dialect: "sqlite",
  driver: "turso",
  dbCredentials: {
    url: process.env.TURSO_TENANT_DB_URL as string,
    authToken: process.env.TURSO_TENANT_GROUP_AUTH_TOKEN as string,
  },
  verbose: true,
  strict: true,
});
