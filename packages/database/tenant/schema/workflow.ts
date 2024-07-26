import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../lib/id.ts";
import { organization } from "./organization.ts";

export const workflow = sqliteTable(
  "workflow",
  {
    id: text("id").$defaultFn(createIdWithPrefix("workflow")).primaryKey(),
    organizationSlug: text("organization_slug").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, {
        onDelete: "cascade",
      }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    public: integer("public", { mode: "boolean" }).default(true),
    layout: text("layout", {
      mode: "json",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
    publishedAt: integer("published_at", { mode: "timestamp" }),
  },
  (w) => ({
    slugIdx: uniqueIndex("workflow_slug_idx").on(w.slug),
    nameIdx: index("workflow_name_idx").on(w.name),
  }),
);
