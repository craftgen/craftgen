import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { organizationMembers } from "./organization/index.ts";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  fullName: text("full_name"),
  email: text("email"),
  username: text("username").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at").default(sql`(cast(unixepoch() as int))`),
  updatedAt: integer("updated_at").default(sql`(cast(unixepoch() as int))`),
});

export const userRelations = relations(user, ({ many }) => ({
  organizationMembers: many(organizationMembers),
}));
