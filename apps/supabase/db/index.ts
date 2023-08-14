import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "postgres";
import { Pool } from "pg";
import * as schema from "./schema";
export * from "./schema";
// import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: connectionString });
// const postgresSql = postgres(connectionString, { max: 1 });
export const db = drizzle(pool, { schema });
export * from "drizzle-orm";
