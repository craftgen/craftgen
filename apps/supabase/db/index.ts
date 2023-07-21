import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
export * from './schema';
// import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
console.log(connectionString);
const postgresSql = postgres(connectionString, { max: 1 });
export const db = drizzle(postgresSql, { schema });

// export const rls = (query) => {
//   return db.transaction(async (tx) => {
//     await tx.execute(sql`SELECT set_config(${claimsSetting}, ${claims}, TRUE)`);
//     await tx.execute(query);
//   });
// };

// async function main() {
//   const claimsSetting = "request.jwt.claims";
//   const jwtSecret = "super-secret-jwt-token-with-at-least-32-characters-long";
//   const jwtToken =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjg5MjY2MzIzLCJzdWIiOiIyZWZlNWIxZS1iMGY2LTRiYzgtYWEwYy0wNjM1Mzc3NDQ2ZTQiLCJlbWFpbCI6Im5lY21ldHRpbi5rYXJha2F5YUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6Imdvb2dsZSIsInByb3ZpZGVycyI6WyJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FBY0hUdGVWSUNQMHM4bkV5ZTM3eTA4OW03ZVZHaTduSHlaaHZBSFlDT0F2ejY2amNxRjM9czk2LWMiLCJlbWFpbCI6Im5lY21ldHRpbi5rYXJha2F5YUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiTmVjbWV0dGluIEthcmFrYXlhIiwiaXNzIjoiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vdXNlcmluZm8vdjIvbWUiLCJuYW1lIjoiTmVjbWV0dGluIEthcmFrYXlhIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FBY0hUdGVWSUNQMHM4bkV5ZTM3eTA4OW03ZVZHaTduSHlaaHZBSFlDT0F2ejY2amNxRjM9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwNTM5MDE2NTQwOTA5MTQ1ODg0OCIsInN1YiI6IjEwNTM5MDE2NTQwOTA5MTQ1ODg0OCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNjg5MjYyNzIzfV0sInNlc3Npb25faWQiOiJhOWE1MGFlZS00MGYwLTQwM2EtODVlOS02MWIwZDk0M2Y4MzgifQ.qGClccafEdy-m__u1a2dTROxOIjwNLzKTBNBPQLtgow";
//   const { payload } = await jose.jwtVerify(
//     jwtToken,
//     new TextEncoder().encode(jwtSecret)
//   );

//   const claims = JSON.stringify(payload);
//   console.log("claims", claims);

//   const rls = async (query?) => {
//     const q = sql`SELECT set_config(${claimsSetting}, ${claims}, TRUE)`;

//     // return db.transaction(async (tx) => {
//     // await db.execute(
//     //   sql`SELECT set_config(${claimsSetting}, ${claims}, TRUE)`
//     // );
//     // await db.select().from(schema.contact).toSQL();
//     const finalquery = sql.join([q, query], sql` `);
//     console.log(JSON.stringify(finalquery, null, 2));
//     return db.execute(finalquery);
//   };
//   // db.select().from(schema.contact)
//   const values = await rls(db.select().from(schema.contact).toSQL());
//   console.log(values);
// }
// main();
