import { createClient } from "npm:@libsql/client/node";
import { sql } from "npm:drizzle-orm";
import { drizzle } from "npm:drizzle-orm/libsql";
import { integer, sqliteTable, text } from "npm:drizzle-orm/sqlite-core";

import { IQueueDatabase, Job, Machine } from "./index.ts";

// Define the schema
const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  machineId: text("machineId").notNull(),
  data: text("data").notNull(),
  status: text("status").notNull(),
  priority: integer("priority").notNull(),
  attempts: integer("attempts").notNull(),
  maxAttempts: integer("maxAttempts").notNull(),
  createdAt: integer("createdAt").notNull(),
  processedAt: integer("processedAt"),
});

const machines = sqliteTable("machines", {
  id: text("id").primaryKey(),
  config: text("config").notNull(),
  createdAt: integer("createdAt").notNull(),
});

class DenoSQLiteQueueDatabase implements IQueueDatabase {
  private db: ReturnType<typeof drizzle>;

  constructor(dbPath: string) {
    const client = createClient({
      url: `file:${dbPath}`,
    });
    this.db = drizzle(client, {
      schema: {
        jobs,
        machines,
      },
    });
    // this.initializeTables();
  }

  private async initializeTables() {
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machineId TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT NOT NULL,
        priority INTEGER NOT NULL,
        attempts INTEGER NOT NULL,
        maxAttempts INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        processedAt INTEGER
      )
    `);
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS machines (
        id TEXT PRIMARY KEY,
        config TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `);
  }

  async insertJob(job: Partial<Job>): Promise<number> {
    const result = await this.db
      .insert(jobs)
      .values({
        machineId: job.machineId!,
        data: job.data!,
        status: job.status!,
        priority: job.priority!,
        attempts: job.attempts!,
        maxAttempts: job.maxAttempts!,
        createdAt: Date.now(),
      })
      .returning({ insertedId: jobs.id });
    return result[0].insertedId;
  }

  async getNextJob(machineId: string): Promise<Job | undefined> {
    const result = await this.db
      .select()
      .from(jobs)
      .where(
        sql`machineId = ${machineId} AND status = 'waiting' AND attempts < maxAttempts`,
      )
      .orderBy(sql`priority DESC, createdAt ASC`)
      .limit(1);

    if (result.length === 0) return undefined;
    const job = this.rowToJob(result[0]);
    await this.updateJob(job.id, {
      status: "processing",
      attempts: job.attempts + 1,
      processedAt: new Date(),
    });
    return job;
  }

  async updateJob(jobId: number, update: Partial<Job>): Promise<void> {
    const updateData: any = { ...update };
    if (update.createdAt) updateData.createdAt = update.createdAt.getTime();
    if (update.processedAt)
      updateData.processedAt = update.processedAt.getTime();
    await this.db
      .update(jobs)
      .set(updateData)
      .where(sql`id = ${jobId}`);
  }

  async insertMachine(machine: Partial<Machine>): Promise<void> {
    await this.db.insert(machines).values({
      id: machine.id!,
      config: machine.config!,
      createdAt: Date.now(),
    });
  }

  async getMachine(machineId: string): Promise<Machine | undefined> {
    const result = await this.db
      .select()
      .from(machines)
      .where(sql`id = ${machineId}`);
    return result.length > 0 ? this.rowToMachine(result[0]) : undefined;
  }

  async updateMachine(
    machineId: string,
    update: Partial<Machine>,
  ): Promise<void> {
    const updateData: any = { ...update };
    if (update.createdAt) updateData.createdAt = update.createdAt.getTime();
    await this.db
      .update(machines)
      .set(updateData)
      .where(sql`id = ${machineId}`);
  }

  async deleteMachine(machineId: string): Promise<void> {
    await this.db.delete(machines).where(sql`id = ${machineId}`);
  }

  private rowToJob(row: any): Job {
    return {
      id: row.id,
      machineId: row.machineId,
      data: row.data,
      status: row.status,
      priority: row.priority,
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
      createdAt: new Date(row.createdAt),
      processedAt: row.processedAt ? new Date(row.processedAt) : null,
    };
  }

  private rowToMachine(row: any): Machine {
    return {
      id: row.id,
      config: row.config,
      createdAt: new Date(row.createdAt),
    };
  }
}

export { DenoSQLiteQueueDatabase };
