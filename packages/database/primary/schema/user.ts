import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { organization, organizationMembers } from "./organization/index.ts";

export const user = sqliteTable("user", {
  id: text("id").primaryKey().$type<`user_${string}`>(),
  fullName: text("full_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  username: text("username").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at").default(sql`(cast(unixepoch() as int))`),
  updatedAt: integer("updated_at").default(sql`(cast(unixepoch() as int))`),
});

export const userRelations = relations(user, ({ many }) => ({
  organizationMembers: many(organizationMembers),
}));
