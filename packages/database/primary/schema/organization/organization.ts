import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../../lib/id.ts";

export const organization = sqliteTable(
  "organization",
  {
    id: text("id").$defaultFn(createIdWithPrefix("org")).primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    personal: integer("personal", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at").default(sql`(cast(unixepoch() as int))`),
    updatedAt: integer("updated_at").default(sql`(cast(unixepoch() as int))`),
    database_name: text("database_name")
      .$defaultFn(createIdWithPrefix("org", "-"))
      .$type<`org-${string}`>()
      .notNull(),
    database_auth_token: text("database_auth_token"),
  },
  (orgs) => ({
    slugIdx: uniqueIndex("organization_slug_idx").on(orgs.slug),
    nameIdx: index("organization_name_idx").on(orgs.name),
  }),
);
