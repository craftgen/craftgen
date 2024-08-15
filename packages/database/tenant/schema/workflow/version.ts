import { relations } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  unique,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../../lib/id.ts";
import { context } from "../context.ts";
import { organization } from "../organization/organization.ts";
import { workflowEdge } from "./edge.ts";
import { workflowNode } from "./node.ts";
import { workflow } from "./workflow.ts";

export const workflowVersion = sqliteTable(
  "workflow_version",
  {
    id: text("id").$defaultFn(createIdWithPrefix("version")).primaryKey(),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflow.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    contextId: text("context_id").references(
      (): AnySQLiteColumn => context.id,
      {
        onDelete: "cascade",
      },
    ),
    previousVersionId: text("previous_workflow_version_id"),
    version: integer("version").notNull().default(0),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    changeLog: text("change_log").default("Workin in progress"),
  },
  (workflowVersion) => {
    return {
      unique: unique().on(workflowVersion.workflowId, workflowVersion.version),
    };
  },
);

export const workflowVersionRelations = relations(
  workflowVersion,
  ({ one, many }) => ({
    workflow: one(workflow, {
      fields: [workflowVersion.workflowId],
      references: [workflow.id],
    }),
    edges: many(workflowEdge),
    nodes: many(workflowNode),
    context: one(context, {
      fields: [workflowVersion.contextId],
      references: [context.id],
    }),
    contexts: many(context),
    previousVersion: one(workflowVersion, {
      fields: [workflowVersion.previousVersionId],
      references: [workflowVersion.id],
    }),
    // executions: many(workflowExecution),
    organization: one(organization, {
      fields: [workflowVersion.organizationId],
      references: [organization.id],
    }),
  }),
);
