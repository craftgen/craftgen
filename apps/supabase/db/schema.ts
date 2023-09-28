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
  serial,
} from "drizzle-orm/pg-core";

import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import z from "zod";

import { relations } from "drizzle-orm";

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

export const playground = pgTable(
  "playground",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
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
    version: integer("version").notNull().default(0), // The version 0 is the latest version.
    changeLog: text("change_log").default("initial version"),
  },
  (p) => {
    return {
      slug: unique().on(p.project_id, p.slug, p.version),
    };
  }
);

/**
 * This table is used for store `latest` data for the nodes in the playground;
 */
export const nodeData = pgTable("node_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  state: json("state"),
});

/**
 * This is used for storing the execution data for the nodes in the playground
 */
export const nodeExecutionData = pgTable("node_execution_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  execution_id: uuid("execution_id")
    .notNull()
    .references(() => playgroundExecution.id, { onDelete: "cascade" }),
  node_id: uuid("node_id")
    .notNull()
    .references(() => nodeData.id, { onDelete: "cascade" }),
  state: json("state"),
});

export const executionGraph = pgTable("execution_graph", {
  id: uuid("id").primaryKey().defaultRandom(),
  execution_id: uuid("execution_id")
    .notNull()
    .references(() => playgroundExecution.id, { onDelete: "cascade" }),
  source_node_execution_data_id: uuid("source_node_id")
    .notNull()
    .references(() => nodeExecutionData.id, { onDelete: "cascade" }),
  target_node_execution_data_id: uuid("target_node_id")
    .notNull()
    .references(() => nodeExecutionData.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const executionGraphRelations = relations(executionGraph, ({ one }) => ({
  execution: one(playgroundExecution, {
    fields: [executionGraph.execution_id],
    references: [playgroundExecution.id],
  }),
  sourceNodeExecutionData: one(nodeExecutionData, {
    fields: [executionGraph.source_node_execution_data_id],
    references: [nodeExecutionData.id],
  }),
  targetNodeExecutionData: one(nodeExecutionData, {
    fields: [executionGraph.target_node_execution_data_id],
    references: [nodeExecutionData.id],
  }),
}));

export const playgroundEdge = pgTable(
  "playground_edge",
  {
    playgroundId: uuid("playground_id")
      .notNull()
      .references(() => playground.id, {
        onDelete: "cascade",
      }),
    source: uuid("source")
      .notNull()
      .references(() => playgroundNode.id, { onDelete: "cascade" }),
    sourceOutput: text("source_output").notNull(),
    target: uuid("target")
      .notNull()
      .references(() => playgroundNode.id, { onDelete: "cascade" }),
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

export const selectPlaygroundEdgeSchema = createInsertSchema(playgroundEdge);

export const playgroundEdgeRelations = relations(playgroundEdge, ({ one }) => ({
  source: one(playgroundNode, {
    fields: [playgroundEdge.source],
    references: [playgroundNode.id],
  }),
  target: one(playgroundNode, {
    fields: [playgroundEdge.target],
    references: [playgroundNode.id],
  }),
  playground: one(playground, {
    fields: [playgroundEdge.playgroundId],
    references: [playground.id],
  }),
}));
type Position = {
  x: number;
  y: number;
};

export const playgroundNode = pgTable("playground_node", {
  id: uuid("id")
    .primaryKey()
    .references(() => nodeData.id, {
      onDelete: "cascade",
    })
    .notNull(),
  playground_id: uuid("playground_id")
    .notNull()
    .references(() => playground.id, {
      onDelete: "cascade",
    }),
  position: json("position").$type<Position>().notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  label: text("label").notNull(),
  color: text("color").notNull(),
  type: text("type").notNull(),
});

export const playgroundExecution = pgTable("playground_execution", {
  id: uuid("id").primaryKey().defaultRandom(),
  playground_id: uuid("playground_id")
    .notNull()
    .references(() => playground.id, {
      onDelete: "cascade",
    }),
  playground_version: text("playground_version").notNull(),
  status: text("status")
    .$type<"active" | "done" | "error" | "stopped">()
    .default("active")
    .notNull(),
  startedAt: timestamp("timestamp").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
});

export const playgroundExecutionRelations = relations(
  playgroundExecution,
  ({ one }) => ({
    playground: one(playground, {
      fields: [playgroundExecution.playground_id],
      references: [playground.id],
    }),
  })
);

export const selectPlaygroundNodeSchema = createSelectSchema(playgroundNode, {
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const playgroundRelations = relations(playground, ({ one, many }) => ({
  project: one(project, {
    fields: [playground.project_id],
    references: [project.id],
  }),
  edges: many(playgroundEdge),
  nodes: many(playgroundNode),
}));

export const playgroundNodeRelations = relations(playgroundNode, ({ one }) => ({
  node: one(nodeData, {
    fields: [playgroundNode.id],
    references: [nodeData.id],
  }),
  playground: one(playground, {
    fields: [playgroundNode.playground_id],
    references: [playground.id],
  }),
}));

export const nodeDataRelations = relations(nodeData, ({ one, many }) => ({
  project: one(project, {
    fields: [nodeData.project_id],
    references: [project.id],
  }),
  playgrounds: many(playgroundNode),
}));

export const projectRelations = relations(project, ({ many, one }) => ({
  nodes: many(nodeData),
  playground: many(playground),
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
