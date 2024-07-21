import { relations, sql } from "drizzle-orm";
import {
  blob,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../lib/id";

/**
 * This table is used for store `latest` data for the nodes in the workflow;
 */
export const context = sqliteTable("context", {
  id: text("id").$defaultFn(createIdWithPrefix("context")).primaryKey(),
  //  workflow_id: text("workflow_id")
  //    .notNull()
  //    .references(() => workflow.id, {
  //      onDelete: "cascade",
  //    }),
  //  workflow_version_id: text("workflow_version_id")
  //    .notNull()
  //    .references(() => workflowVersion.id, { onDelete: "set null" }),
  //  parent_id: text("parent_id").references((): AnyPgColumn => context.id, {
  //    onDelete: "cascade",
  //  }),
  previousContextId: text("previous_context_id"),
  type: text("type").notNull(),
  snapshot: blob("snapshot", { mode: "json" }).$type<{ foo: string }>(),
});
