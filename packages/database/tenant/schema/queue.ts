import {
  blob,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const dataVersion = sqliteTable("data_version", {
  k: integer("k").primaryKey(),
  version: integer("version").notNull(),
});

export const kv = sqliteTable("kv", {
  k: blob("k").primaryKey(),
  v: blob("v").notNull(),
  vEncoding: integer("v_encoding").notNull(),
  version: integer("version").notNull(),
  expirationMs: integer("expiration_ms").notNull().default(-1),
});

export const queue = sqliteTable(
  "queue",
  {
    ts: integer("ts").notNull(),
    id: text("id").notNull(),
    data: blob("data").notNull(),
    backoffSchedule: text("backoff_schedule").notNull(),
    keysIfUndelivered: blob("keys_if_undelivered").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ts, table.id] }),
  }),
);

export const queueRunning = sqliteTable(
  "queue_running",
  {
    deadline: integer("deadline").notNull(),
    id: text("id").notNull(),
    data: blob("data").notNull(),
    backoffSchedule: text("backoff_schedule").notNull(),
    keysIfUndelivered: blob("keys_if_undelivered").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.deadline, table.id] }),
  }),
);
