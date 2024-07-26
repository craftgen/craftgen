import { Surreal } from "npm:surrealdb.js";
import z from "npm:zod";

let db: Surreal | undefined;
export const getDB = async () => {
  if (db) {
    return db;
  }
  db = new Surreal();

  // Connect to the database
  await db.connect("http://127.0.0.1:12345/rpc");

  // Select a specific namespace / database
  await db.use({
    namespace: "test",
    database: "test",
  });

  // Signin as a namespace, database, or root user
  await db.signin({
    username: "root",
    password: "root",
  });
  return db;
};

export function record<Table extends string = string>(table?: Table) {
  return z.custom<`${Table}:${string}`>(
    (val) =>
      typeof val === "string" && table ? val.startsWith(table + ":") : true,
    {
      message: ["Must be a record", table && `Table must be: "${table}"`]
        .filter((a) => a)
        .join("; "),
    },
  );
}
