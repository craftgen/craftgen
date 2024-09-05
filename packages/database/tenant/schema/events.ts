import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createIdWithPrefix } from "../../lib/id.ts";

export const events = sqliteTable("events", {
  id: text("id").$defaultFn(createIdWithPrefix("event")).primaryKey(),
  machineId: text("machine_id").notNull(),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  status: text("status")
    .notNull()
    .$type<"queued" | "processing" | "retrying">()
    .default("queued"),
  scheduledFor: integer("scheduled_for", { mode: "timestamp" }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  processingStartedAt: integer("processing_started_at", { mode: "timestamp" }),
});

export type ActorEvent = typeof events.$inferSelect;

export const processedEvents = sqliteTable("processed_events", {
  id: text("id").$defaultFn(createIdWithPrefix("event")).primaryKey(),
  machineId: text("machine_id").notNull(),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  status: text("status").notNull().$type<"complete" | "failed">(),
  attempts: integer("attempts").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  processingStartedAt: integer("processing_started_at", {
    mode: "timestamp",
  }).notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  processingDuration: integer("processing_duration").notNull(), // in milliseconds
});
