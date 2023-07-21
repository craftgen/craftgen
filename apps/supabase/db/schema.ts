import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  uuid,
  PgReal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

export const user = pgTable("user", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userRelations = relations(user, ({many}) => ({
  projectMembers: many(projectMembers),
}))

export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  site: text("site").notNull(),
  slug: text("slug").notNull(),
});

export const projectRelations = relations(project, ({many, one}) => ({
  members: many(projectMembers),
  articles: many(articles),
}))

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'editor', 'viewer']);

export const projectMembers = pgTable("project_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => project.id),
  userId: uuid("user_id").notNull().references(() => user.id),
  role: memberRoleEnum('member_role').notNull().default('viewer'),
});

export const projectMemberRelations = relations(projectMembers, ({one}) => ({
  project: one(project, {
    fields: [projectMembers.projectId],
    references: [project.id]
  }),
  user: one(user, {
    fields: [projectMembers.userId],
    references: [user.id]
  }),
}))

export const articleStatusEnum = pgEnum('article_status', ['draft', 'published', 'archived']);

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey(),
  projectId: uuid("project_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: articleStatusEnum('article_status').notNull().default('draft'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const articleMetadata = pgTable("article_metadata", {
  id: uuid("id").primaryKey(),
  articleId: uuid("article_id").notNull(),
})




