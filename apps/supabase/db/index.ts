// import { drizzle } from "drizzle-orm/node-postgres";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// import { Pool } from "pg";
import * as schema from "./schema";
import { sql } from "drizzle-orm";
export * from "./schema";
import { Session } from "@supabase/supabase-js";
import * as jose from "jose";

const connectionString = process.env.POSTGRES_URL;
// const pool = new Pool({ connectionString: connectionString });
const postgresSql = postgres(connectionString as string, { max: 1 });
export const db = drizzle(postgresSql, { schema, logger: false });
export * from "drizzle-orm";

export function authDB<T>(
  session: Session,
  cb: (sql: PostgresJsDatabase) => T | Promise<T>
): Promise<T> {
  // You can add a validation here for the accessToken - we rely on supabase for now
  const jwtClaim = jose.decodeJwt(session.access_token);
  const role = jwtClaim.role as string;

  return db.transaction(async (tx) => {
    // Set JWT to enable RLS. supabase adds the role and the userId (sub) to the jwt claims
    await tx.execute(
      sql`SELECT set_config('request.jwt.claims', '${sql.raw(
        JSON.stringify(jwtClaim)
      )}', TRUE)`
    );

    // do not use postgres because it will bypass the RLS, set role to authenticated
    await tx.execute(sql`set role '${sql.raw(role)}'`);

    return cb(tx as any);
  }) as Promise<T>;
}
