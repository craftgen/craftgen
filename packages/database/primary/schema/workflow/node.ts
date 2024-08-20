import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../../lib/id.ts";
import { context } from "../context.ts";
import { organization } from "../organization/organization.ts";
import { workflowVersion } from "./version.ts";
import { workflow } from "./workflow.ts";

export type Position = {
  x: number;
  y: number;
};

export const workflowNode = sqliteTable("workflow_node", {
  id: text("id").$defaultFn(createIdWithPrefix("node")).primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, {
      onDelete: "cascade",
    }),
  workflowVersionId: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersion.id, {
      onDelete: "cascade",
    }),
  contextId: text("context_id")
    .notNull()
    .references(() => context.id, {
      onDelete: "cascade",
    }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, {
      onDelete: "cascade",
    }),
  position: text("position", { mode: "json" }).$type<Position>().notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  color: text("color").notNull(),
  type: text("type").notNull(),
});

export const workflowNodeRelations = relations(workflowNode, ({ one }) => ({
  context: one(context, {
    // the parent Actor for controls the node itself.
    fields: [workflowNode.contextId],
    references: [context.id],
  }),
  workflow: one(workflow, {
    fields: [workflowNode.workflowId],
    references: [workflow.id],
  }),
  workflowVersion: one(workflowVersion, {
    fields: [workflowNode.workflowVersionId],
    references: [workflowVersion.id],
  }),
  organization: one(organization, {
    fields: [workflowNode.organizationId],
    references: [organization.id],
  }),
}));
