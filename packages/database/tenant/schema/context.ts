import {
  sqliteTable,
  text,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../lib/id.ts";
import { workflowVersion } from "./index.ts";
import { organization } from "./organization/organization.ts";
import { workflow } from "./workflow/workflow.ts";

/**
 * This table is used for store `latest` data for the nodes in the workflow;
 */
export const context = sqliteTable("context", {
  id: text("id").$defaultFn(createIdWithPrefix("ctx")).primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, {
      onDelete: "cascade",
    }),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, {
      onDelete: "cascade",
    }),
  workflowVersionId: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersion.id, { onDelete: "set null" }),
  parent_id: text("parent_id").references((): AnySQLiteColumn => context.id, {
    onDelete: "cascade",
  }),
  previousContextId: text("previous_context_id"),
  type: text("type").notNull(),
  snapshot: text("snapshot", { mode: "json" }).$type<{ foo: string }>(),
});
