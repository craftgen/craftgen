import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../../lib/id.ts";
import { user } from "../user.ts";
import { organization } from "./index.ts";

export const organizationMembers = sqliteTable("organization_members", {
  id: text("id").$defaultFn(createIdWithPrefix("member")).primaryKey(),
  organizationId: text("organization_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  createdAt: integer("created_at").default(sql`(cast(unixepoch() as int))`),
  updatedAt: integer("updated_at").default(sql`(cast(unixepoch() as int))`),
});

export const organizationMemberRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationMembers.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [organizationMembers.userId],
      references: [user.id],
    }),
  }),
);
