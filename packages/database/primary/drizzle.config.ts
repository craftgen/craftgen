import { defineConfig } from "drizzle-kit";

console.log("CRRED", {
  TURSO_PRIMARY_DB_URL: process.env.TURSO_PRIMARY_DB_URL,
  TURSO_DB_AUTH_TOKEN: process.env.TURSO_PRIMARY_DB_AUTH_TOKEN,
});

export default defineConfig({
  schema: "./primary/schema/index.ts",
  out: "./primary/migrations",
  dialect: "sqlite",
  driver: "turso",
  dbCredentials: {
    url: process.env.TURSO_PRIMARY_DB_URL as string,
    authToken: process.env.TURSO_PRIMARY_DB_AUTH_TOKEN as string,
  },
  verbose: true,
  strict: true,
});
