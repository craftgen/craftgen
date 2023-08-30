import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  json,
  unique,
  boolean,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  email: text("email").notNull(),
  google_access_token: text("google_access_token"),
  google_refresh_token: text("google_refresh_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  projectMembers: many(projectMembers),
}));

export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  site: text("site").notNull().unique(),
  slug: text("slug").notNull().unique(),
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
    value: text("value").notNull(),
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

export const playground = pgTable("playground", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  public: boolean("public").notNull().default(false),
  layout: json("layout"),
  edges: json("edges").notNull(),
  nodes: json("nodes").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const playgroundRelations = relations(playground, ({ one, many }) => ({
  project: one(project, {
    fields: [playground.project_id],
    references: [project.id],
  }),
}));

export const nodeData = pgTable("node_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  state: json("state"),
});

export const nodeDataRelations = relations(nodeData, ({ one, many }) => ({
  project: one(project),
  playgrounds: many(nodeToPlayground),
}));

export const nodeToPlayground = pgTable("node_to_playground", {
  id: uuid("id").primaryKey().defaultRandom(),
  node_id: uuid("node_id")
    .notNull()
    .references(() => nodeData.id, {
      onDelete: "cascade",
    }),
  playground_id: uuid("playground_id")
    .notNull()
    .references(() => playground.id, {
      onDelete: "cascade",
    }),
});

export const nodeToPlaygroundRelations = relations(
  nodeToPlayground,
  ({ one }) => ({
    node: one(nodeData),
    playground: one(playground),
  })
);

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
