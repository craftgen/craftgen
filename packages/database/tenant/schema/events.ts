import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../lib/id.ts";

export const queuedEvents = sqliteTable("queued_events", {
  id: text("id").$defaultFn(createIdWithPrefix("event")).primaryKey(),
  machineId: text("machine_id").notNull(),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  scheduledFor: integer("scheduled_for", { mode: "timestamp" }),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const processingEvents = sqliteTable("processing_events", {
  id: text("id").$defaultFn(createIdWithPrefix("event")).primaryKey(),
  machineId: text("machine_id").notNull().unique(),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  lockedUntil: integer("locked_until", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const processedEvents = sqliteTable("processed_events", {
  id: text("id").$defaultFn(createIdWithPrefix("event")).primaryKey(),
  machineId: text("machine_id").notNull(),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  status: text("status").notNull().$type<"complete" | "failed">(),
  attempts: integer("attempts").notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
