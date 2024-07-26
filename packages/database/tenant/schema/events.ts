import { max, sql } from "drizzle-orm";
import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../lib/id.ts";

export const event = sqliteTable("event", {
  id: text("id").$defaultFn(createIdWithPrefix("event")).primaryKey(),
  type: text("type").notNull(),
  payload: blob("payload", { mode: "json" }).notNull(),
  status: text("status")
    .notNull()
    .$type<"pending" | "processing" | "complete">()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  scheduledFor: integer("scheduled_for", { mode: "timestamp" }),

  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
});
