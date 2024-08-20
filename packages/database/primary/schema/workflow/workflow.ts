import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../../lib/id.ts";
import { context } from "../context.ts";
import { organization } from "../organization/organization.ts";
import { workflowEdge } from "./edge.ts";
import { workflowNode } from "./node.ts";
import { workflowVersion } from "./version.ts";

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
    slugUniqueIdx: uniqueIndex("workflow_slug_unique_idx").on(
      w.slug,
      w.organizationId,
    ),
    nameIdx: index("workflow_name_idx").on(w.name),
    slugIdx: index("workflow_slug_idx").on(w.slug),
  }),
);

export const workflowRelations = relations(workflow, ({ one, many }) => ({
  organization: one(organization, {
    fields: [workflow.organizationId],
    references: [organization.id],
  }),
  versions: many(workflowVersion),
  edges: many(workflowEdge),
  nodes: many(workflowNode),
  contexts: many(context),
  // executions: many(workflowExecution),
}));
