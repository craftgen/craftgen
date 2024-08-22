import { relations } from "drizzle-orm";
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { workflowNode } from "./node.ts";
import { workflowVersion } from "./version.ts";
import { workflow } from "./workflow.ts";

export const workflowEdge = sqliteTable(
  "workflow_edge",
  {
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
    source: text("source")
      .notNull()
      .references(() => workflowNode.id, { onDelete: "cascade" }),
    sourceOutput: text("source_output").notNull(),
    target: text("target")
      .notNull()
      .references(() => workflowNode.id, { onDelete: "cascade" }),
    targetInput: text("target_input").notNull(),
  },
  (edge) => {
    return {
      pk: primaryKey({
        columns: [
          edge.source,
          edge.target,
          edge.sourceOutput,
          edge.targetInput,
        ],
      }),
    };
  },
);

export const workflowEdgeRelations = relations(workflowEdge, ({ one }) => ({
  source: one(workflowNode, {
    fields: [workflowEdge.source],
    references: [workflowNode.id],
  }),
  target: one(workflowNode, {
    fields: [workflowEdge.target],
    references: [workflowNode.id],
  }),
  workflow: one(workflow, {
    fields: [workflowEdge.workflowId],
    references: [workflow.id],
  }),
  workflowVersion: one(workflowVersion, {
    fields: [workflowEdge.workflowVersionId],
    references: [workflowVersion.id],
  }),
}));
