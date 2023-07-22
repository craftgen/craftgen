import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  PgReal,
  pgEnum,
  jsonb,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { Edge, Node } from "reactflow";

export const user = pgTable("user", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  email: text("email").notNull(),
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

export const dataSet = pgTable("data_set", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => project.id),
  name: text("name").notNull(),
  description: text("description"),
});

export const dataRow = pgTable("data_row", {
  id: uuid("id").primaryKey().defaultRandom(),
  data_set_id: uuid("data_set_id")
    .notNull()
    .references(() => dataSet.id),
  data: json("data").notNull(),
});

export const dataRowRelations = relations(dataRow, ({ one }) => ({
  dataSet: one(dataSet),
}));

export const playground = pgTable("playground", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => project.id),
  name: text("name").notNull(),
  edges: json("edges").$type<Edge[]>().notNull(),
  nodes: json("nodes").$type<Node[]>().notNull(),
});

export const nodeData = pgTable("node_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  playground_id: uuid("playground_id")
    .notNull()
    .references(() => playground.id),
  type: text("type").notNull(),
  data: json("data").notNull(),
});

export const projectRelations = relations(project, ({ many, one }) => ({
  playground: many(playground),
  members: many(projectMembers),
  articles: many(articles),
  datasets: many(dataSet),
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
    .references(() => user.id),
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

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey(),
  projectId: uuid("project_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: articleStatusEnum("article_status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const articleMetadata = pgTable("article_metadata", {
  id: uuid("id").primaryKey(),
  articleId: uuid("article_id").notNull(),
});
