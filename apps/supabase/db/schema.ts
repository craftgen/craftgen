import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  json,
  unique,
  boolean,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import z from "zod";

import { relations } from "drizzle-orm";

const createIdWithPrefix = (prefix: string) => () => `${prefix}_${createId()}`;

export const user = pgTable("user", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  username: text("username").unique(),
  email: text("email").notNull(),
  avatar_url: text("avatar_url"),
  google_scopes: text("google_scopes").array(),
  google_access_token: text("google_access_token"),
  google_refresh_token: text("google_refresh_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  platforms: text("platforms").array(),
});

export const userRelations = relations(user, ({ many }) => ({
  projectMembers: many(projectMembers),
}));

export const project = pgTable("project", {
  id: text("id").$defaultFn(createIdWithPrefix("project")).primaryKey(),
  name: text("name").notNull(),
  site: text("site").unique(),
  slug: text("slug").notNull().unique(),
  personal: boolean("personal").notNull().default(false),
});

export const apiKey = pgTable(
  "project_api_key",
  {
    id: text("id").$defaultFn(createIdWithPrefix("key")).primaryKey(),
    project_id: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: text("key").notNull(),
  },
  (t) => ({
    key: unique().on(t.project_id, t.key),
  })
);

export const variable = pgTable(
  "project_variable",
  {
    id: text("id").$defaultFn(createIdWithPrefix("variable")).primaryKey(),
    project_id: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value"),
    system: boolean("is_system").notNull().default(false),
  },
  (t) => ({
    key: unique().on(t.project_id, t.key),
  })
);

export const workflow = pgTable(
  "workflow",
  {
    // id: uuid("id").primaryKey().defaultRandom(),
    id: text("id").$defaultFn(createIdWithPrefix("workflow")).primaryKey(),
    projectSlug: text("project_slug")
      .notNull()
      .references(() => project.slug, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    public: boolean("public").notNull().default(false),
    layout: json("layout"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    publishedAt: timestamp("published_at"),
  },
  (p) => {
    return {
      slug: unique().on(p.projectId, p.slug),
    };
  }
);

export const workflowVersion = pgTable(
  "workflow_version",
  {
    id: text("id").$defaultFn(createIdWithPrefix("version")).primaryKey(),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflow.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    previousVersionId: text("previous_workflow_version_id"),
    version: integer("version").notNull().default(0), 
    publishedAt: timestamp("published_at"),
    changeLog: text("change_log").default("Workin in progress"),
  },
  (workflowVersion) => {
    return {
      unique: unique().on(workflowVersion.workflowId, workflowVersion.version),
    };
  }
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
    previousVersion: one(workflowVersion, {
      fields: [workflowVersion.previousVersionId],
      references: [workflowVersion.id],
    }),
    executions: many(workflowExecution),
    project: one(project, {
      fields: [workflowVersion.projectId],
      references: [project.id],
    }),
  })
);

export const shapeOfContext = z.object({
  inputs: z.any(),
  settings: z.any(),
  outputs: z.any(),
});

export const shapeOfState = z.object({
  state: z.string(),
  status: z.enum(["active", "error", "done"]),
  context: shapeOfContext,
});

/**
 * This table is used for store `latest` data for the nodes in the workflow;
 */
export const context = pgTable("context", {
  id: text("id").$defaultFn(createIdWithPrefix("context")).primaryKey(),
  project_id: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  previousContextId: text("previous_context_id"),
  type: text("type").notNull(),
  state: json("state").$type<z.infer<typeof shapeOfContext>>(), // TODO: rename to context
});

export const workflowEdge = pgTable(
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
      pk: primaryKey(
        edge.source,
        edge.target,
        edge.sourceOutput,
        edge.targetInput
      ),
    };
  }
);

export const selectWorkflowEdgeSchema = createInsertSchema(workflowEdge);

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
type Position = {
  x: number;
  y: number;
};

export const workflowNode = pgTable("workflow_node", {
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
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, {
      onDelete: "cascade",
    }),
  position: json("position").$type<Position>().notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  label: text("label").notNull(),
  color: text("color").notNull(),
  type: text("type").notNull(),
});

export const workflowExecution = pgTable("workflow_execution", {
  id: text("id").$defaultFn(createIdWithPrefix("execution")).primaryKey(),
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
  status: text("status")
    .$type<"active" | "done" | "error" | "stopped">()
    .default("active")
    .notNull(),
  startedAt: timestamp("timestamp").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"),
});

export const workflowExecutionRelations = relations(
  workflowExecution,
  ({ one, many }) => ({
    workflow: one(workflow, {
      fields: [workflowExecution.workflowId],
      references: [workflow.id],
    }),
    workflowVersion: one(workflowVersion, {
      fields: [workflowExecution.workflowVersionId],
      references: [workflowVersion.id],
    }),
    steps: many(workflowExecutionStep),
    executionData: many(nodeExecutionData),
  })
);

export const workflowExecutionStep = pgTable("workflow_execution_step", {
  id: text("id").$defaultFn(createIdWithPrefix("execution_step")).primaryKey(),
  workflowExecutionId: text("workflow_execution_id")
    .notNull()
    .references(() => workflowExecution.id, { onDelete: "cascade" }),
  source_node_execution_data_id: text("source_node_id")
    .notNull()
    .references(() => nodeExecutionData.id, { onDelete: "cascade" }),
  target_node_execution_data_id: text("target_node_id")
    .notNull()
    .references(() => nodeExecutionData.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
/**
 * This is used for storing the execution data for the nodes in the workflow
 */
export const nodeExecutionData = pgTable("node_execution_data", {
  id: text("id").$defaultFn(createIdWithPrefix("node_execution")).primaryKey(),
  workflowExecutionId: text("workflow_execution_id")
    .notNull()
    .references(() => workflowExecution.id, { onDelete: "cascade" }),
  contextId: text("context_id")
    .notNull()
    .references(() => context.id, { onDelete: "cascade" }),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  workflowVersionId: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersion.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  workflowNodeId: text("workflow_node_id")
    .notNull()
    .references(() => workflowNode.id),
  type: text("type").notNull(),
  state: json("state").$type<z.infer<typeof shapeOfState>>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"),
});

export const nodeExecutionDataRelations = relations(
  nodeExecutionData,
  ({ one }) => ({
    context: one(context, {
      fields: [nodeExecutionData.contextId],
      references: [context.id],
    }),
    workflow: one(workflow, {
      fields: [nodeExecutionData.workflowId],
      references: [workflow.id],
    }),
    workflowVersion: one(workflowVersion, {
      fields: [nodeExecutionData.workflowVersionId],
      references: [workflowVersion.id],
    }),
    workflowNode: one(workflowNode, {
      fields: [nodeExecutionData.workflowNodeId],
      references: [workflowNode.id],
    }),
    workflowExecution: one(workflowExecution, {
      fields: [nodeExecutionData.workflowExecutionId],
      references: [workflowExecution.id],
    }),
  })
);

export const workflowExecutionStepRelations = relations(
  workflowExecutionStep,
  ({ one }) => ({
    execution: one(workflowExecution, {
      fields: [workflowExecutionStep.workflowExecutionId],
      references: [workflowExecution.id],
    }),
    sourceNodeExecutionData: one(nodeExecutionData, {
      fields: [workflowExecutionStep.source_node_execution_data_id],
      references: [nodeExecutionData.id],
    }),
    targetNodeExecutionData: one(nodeExecutionData, {
      fields: [workflowExecutionStep.target_node_execution_data_id],
      references: [nodeExecutionData.id],
    }),
  })
);

export const selectWorkflowNodeSchema = createSelectSchema(workflowNode, {
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const workflowRelations = relations(workflow, ({ one, many }) => ({
  project: one(project, {
    fields: [workflow.projectId],
    references: [project.id],
  }),
  versions: many(workflowVersion),
  edges: many(workflowEdge),
  nodes: many(workflowNode),
}));

export const workflowNodeRelations = relations(
  workflowNode,
  ({ one, many }) => ({
    context: one(context, {
      fields: [workflowNode.contextId],
      references: [context.id],
    }),
    nodeExectutions: many(nodeExecutionData),
    workflow: one(workflow, {
      fields: [workflowNode.workflowId],
      references: [workflow.id],
    }),
    workflowVersion: one(workflowVersion, {
      fields: [workflowNode.workflowVersionId],
      references: [workflowVersion.id],
    }),
    project: one(project, {
      fields: [workflowNode.projectId],
      references: [project.id],
    }),
  })
);

export const contextRelations = relations(context, ({ one, many }) => ({
  project: one(project, {
    fields: [context.project_id],
    references: [project.id],
  }),
  previousContext: one(context, {
    fields: [context.previousContextId],
    references: [context.id],
  }),
  workflows: many(workflowNode),
}));

export const projectRelations = relations(project, ({ many, one }) => ({
  nodes: many(context),
  workflows: many(workflow),
  members: many(projectMembers),
  variables: many(variable),
  apiKeys: many(apiKey),
}));

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "editor",
  "viewer",
]);

export const projectMembers = pgTable("project_members", {
  id: text("id").$defaultFn(createIdWithPrefix("member")).primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    }),
  role: memberRoleEnum("member_role").notNull().default("viewer"),
});

export const projectMemberRelations = relations(projectMembers, ({ one }) => ({
  project: one(project, {
    fields: [projectMembers.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectMembers.userId],
    references: [user.id],
  }),
}));
