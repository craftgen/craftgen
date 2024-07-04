import type { Config } from "drizzle-kit";

const connectionString =
  "postgresql://postgres:postgres@localhost:54322/postgres";
export default {
  schema: "./db/schema.ts",
  driver: "pg",
  out: "./drizzle",
  dbCredentials: {
    connectionString,
  },
} satisfies Config;
