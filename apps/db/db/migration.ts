import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db } from ".";

async function main() {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migration complete");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
main();
