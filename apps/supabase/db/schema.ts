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
  google_scopes: text("google_scopes").array().notNull().default([]),
  google_access_token: text("google_access_token"),
  google_refresh_token: text("google_refresh_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  platforms: text("platforms").array().notNull().default([]),
});

export const userRelations = relations(user, ({ many }) => ({
  projectMembers: many(projectMembers),
}));

export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  site: text("site").unique(),
  slug: text("slug").notNull().unique(),
  personal: boolean("personal").notNull().default(false),
});

export const apiKey = pgTable(
  "project_api_key",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
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
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
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

export const dataSet = pgTable("data_set", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
});

export const dataSetRelations = relations(dataSet, ({ one, many }) => ({
  project: one(project),
  rows: many(dataRow),
}));

export const dataRow = pgTable("data_row", {
  id: uuid("id").primaryKey().defaultRandom(),
  data_set_id: uuid("data_set_id")
    .notNull()
    .references(() => dataSet.id, { onDelete: "cascade" }),
  data: json("data").notNull(),
});

export const dataRowRelations = relations(dataRow, ({ one }) => ({
  dataSet: one(dataSet, {
    fields: [dataRow.data_set_id],
    references: [dataSet.id],
  }),
}));

export const workflow = pgTable(
  "workflow",
  {
    // id: uuid("id").primaryKey().defaultRandom(),
    id: text("id").$defaultFn(createIdWithPrefix("workflow")).primaryKey(),
    projectSlug: text("project_slug")
      .notNull()
      .references(() => project.slug, { onDelete: "cascade" }),
    projectId: uuid("project_id")
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
    id: text("id").$defaultFn(createIdWithPrefix("w_version")).primaryKey(),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflow.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(0), // The version 0 is the latest version.
    publishedAt: timestamp("published_at"),
    changeLog: text("change_log").default("initial version"),
  },
  (workflowVersion) => {
    return {
      unique: unique().on(workflowVersion.workflowId, workflowVersion.version),
    };
  }
);

/**
 * This table is used for store `latest` data for the nodes in the workflow;
 */
export const nodeData = pgTable("node_data", {
  id: text("id").$defaultFn(createIdWithPrefix("nodeData")).primaryKey(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  state: json("state"),
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
}));
type Position = {
  x: number;
  y: number;
};

// TODO: Check this out.
// id: uuid("id")
//   .primaryKey()
//   .references(() => nodeData.id, {   TODO: Check this out.
//     onDelete: "cascade",
//   })
//   .notNull(),
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
  finishedAt: timestamp("finished_at"),
});

export const workflowExecutionRelations = relations(
  workflowExecution,
  ({ one }) => ({
    workflow: one(workflow, {
      fields: [workflowExecution.workflowId],
      references: [workflow.id],
    }),
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
  id: text("id")
    .$defaultFn(createIdWithPrefix("node_execution_data"))
    .primaryKey(),
  workflowExecutionId: text("workflow_execution_id")
    .notNull()
    .references(() => workflowExecution.id, { onDelete: "cascade" }),
  nodeId: text("node_id")
    .notNull()
    .references(() => nodeData.id, { onDelete: "cascade" }),
  state: json("state"),
});

// export const workflowExecutionStepRelations = relations(
//   workflowExecutionStep,
//   ({ one }) => ({
//     execution: one(workflowExecution, {
//       fields: [workflowExecutionStep.workflowExecutionId],
//       references: [workflowExecution.id],
//     }),
//     sourceNodeExecutionData: one(nodeExecutionData, {
//       fields: [workflowExecutionStep.source_node_execution_data_id],
//       references: [nodeExecutionData.id],
//     }),
//     targetNodeExecutionData: one(nodeExecutionData, {
//       fields: [workflowExecutionStep.target_node_execution_data_id],
//       references: [nodeExecutionData.id],
//     }),
//   })
// );

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

export const workflowNodeRelations = relations(workflowNode, ({ one }) => ({
  node: one(nodeData, {
    fields: [workflowNode.id],
    references: [nodeData.id],
  }),
  workflow: one(workflow, {
    fields: [workflowNode.workflowId],
    references: [workflow.id],
  }),
}));

export const nodeDataRelations = relations(nodeData, ({ one, many }) => ({
  project: one(project, {
    fields: [nodeData.project_id],
    references: [project.id],
  }),
  workflows: many(workflowNode),
}));

export const projectRelations = relations(project, ({ many, one }) => ({
  nodes: many(nodeData),
  workflows: many(workflow),
  members: many(projectMembers),
  articles: many(article),
  datasets: many(dataSet),
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
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
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

export const articleStatusEnum = pgEnum("article_status", [
  "draft",
  "published",
  "archived",
]);

export const article = pgTable(
  "article",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: articleStatusEnum("article_status").notNull().default("draft"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    slug: unique("slug").on(t.projectId, t.slug),
  })
);

export const articleRelations = relations(article, ({ one, many }) => ({
  project: one(project, {
    fields: [article.projectId],
    references: [project.id],
  }),
  metadata: one(articleMetadata, {
    fields: [article.id],
    references: [articleMetadata.id],
  }),
  nodes: many(articleNode),
}));

export const articleNode = pgTable("article_node", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => article.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  data: json("data").notNull(),
});

export const Link = pgTable("link", {
  id: uuid("id").primaryKey(),
  articleNodeId: uuid("article_node_id").notNull(),
  type: text("type").$type<"internal" | "external">().notNull(),
  url: text("url").notNull(),
  article: uuid("article_id"),
});

export const articleNodeRelations = relations(articleNode, ({ many, one }) => ({
  links: many(Link),
  article: one(article, {
    fields: [articleNode.articleId],
    references: [article.id],
  }),
}));

export const articleMetadata = pgTable("article_metadata", {
  id: uuid("id").primaryKey(),
  articleId: uuid("article_id").notNull(),
});
