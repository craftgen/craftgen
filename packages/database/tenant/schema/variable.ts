import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../lib/id.ts";
import { organization } from "./index.ts";

export const variable = sqliteTable("variable", {
  id: text("id").$defaultFn(createIdWithPrefix("var")).primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, {
      onDelete: "cascade",
    }),
  key: text("key").notNull().unique(),
  value: text("value"),
  is_system: integer("is_system", { mode: "boolean" }).default(false).notNull(),
  provider: text("provider").notNull(),
  default: integer("default", { mode: "boolean" }).default(false).notNull(),
});
