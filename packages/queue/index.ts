import { Lock, Notify, Queue, Semaphore } from "jsr:@lambdalisue/async";

import { DenoSQLiteQueueDatabase } from "./db.ts";

export interface Job {
  id: number;
  machineId: string;
  data: string;
  status: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt: Date | null;
}

export interface Machine {
  id: string;
  config: string;
  createdAt: Date;
}

export interface IQueueDatabase {
  insertJob(job: Partial<Job>): Promise<number>;
  getNextJob(machineId: string): Promise<Job | undefined>;
  updateJob(jobId: number, update: Partial<Job>): Promise<void>;
  insertMachine(machine: Partial<Machine>): Promise<void>;
  getMachine(machineId: string): Promise<Machine | undefined>;
  updateMachine(machineId: string, update: Partial<Machine>): Promise<void>;
  deleteMachine(machineId: string): Promise<void>;
}

export class DynamicQueue {
  private db: IQueueDatabase;
  private jobQueues: Map<string, Queue<Job>> = new Map();
  private locks: Map<string, Lock<Queue<Job>>> = new Map();

  private semaphore: Semaphore;
  private notify: Notify = new Notify();

  constructor(db: IQueueDatabase, concurrency = 10) {
    this.db = db;
    this.semaphore = new Semaphore(concurrency);
  }

  async createMachine(machineId: string, config: any) {
    await this.db.insertMachine({
      id: machineId,
      config: JSON.stringify(config),
    });
    const queue = new Queue<Job>();
    this.jobQueues.set(machineId, queue);
    this.locks.set(machineId, new Lock(queue));
  }

  async getMachine(machineId: string) {
    const machine = await this.db.getMachine(machineId);
    return machine ? { ...machine, config: JSON.parse(machine.config) } : null;
  }

  async updateMachineConfig(machineId: string, config: any) {
    await this.db.updateMachine(machineId, { config: JSON.stringify(config) });
  }

  async deleteMachine(machineId: string) {
    await this.db.deleteMachine(machineId);
    this.jobQueues.delete(machineId);
    this.locks.delete(machineId);
  }

  async add(
    machineId: string,
    data: any,
    opts: { priority?: number; maxAttempts?: number } = {},
  ) {
    const { priority = 0, maxAttempts = 3 } = opts;
    const machine = await this.getMachine(machineId);
    if (!machine) {
      throw new Error(`Machine ${machineId} does not exist`);
    }
    const jobId = await this.db.insertJob({
      machineId,
      data: JSON.stringify(data),
      priority,
      maxAttempts,
      status: "waiting",
      attempts: 0,
    });
    const job = await this.db.getNextJob(machineId);
    if (job) {
      const lock = this.locks.get(machineId);
      if (lock) {
        await lock.lock((queue) => queue.push(job));
      }
      this.notify.notify();
    }
    return jobId;
  }

  async process(
    machineId: string,
    handler: (job: any, machineConfig: any) => Promise<void>,
  ) {
    const processJob = async () => {
      while (true) {
        await this.semaphore.lock(async () => {
          const lock = this.locks.get(machineId);
          if (!lock) return;

          await lock.lock(async (queue) => {
            let job: Job | undefined;
            if (queue.size > 0) {
              job = await queue.pop();
            } else {
              job = await this.db.getNextJob(machineId);
              if (job) queue.push(job);
            }

            if (job) {
              const machine = await this.getMachine(machineId);
              if (machine) {
                try {
                  await handler(JSON.parse(job.data), machine.config);
                  await this.db.updateJob(job.id, { status: "completed" });
                } catch (error) {
                  await this.handleJobError(job);
                }
              }
            } else {
              // Wait for notification of new job
              await this.notify.notified();
            }
          });
        });
      }
    };

    // Start the processing loop
    processJob();
  }

  private async handleJobError(job: Job) {
    if (job.attempts >= job.maxAttempts) {
      await this.db.updateJob(job.id, { status: "failed" });
    } else {
      await this.db.updateJob(job.id, {
        status: "waiting",
        attempts: job.attempts + 1,
      });
      // Re-queue the job
      const lock = this.locks.get(job.machineId);
      if (lock) {
        await lock.lock((queue) => queue.push(job));
      }
      this.notify.notify();
    }
  }
}

async function main() {
  const queueDb = new DenoSQLiteQueueDatabase("queue.db");
  const queue = new DynamicQueue(queueDb, 5); // Allow 5 concurrent jobs across all machines

  // Create a machine
  await queue.createMachine("printer1", { type: "laser", model: "HP123" });

  // Add some jobs
  await queue.add("printer1", { action: "print", document: "report1.pdf" });
  await queue.add("printer1", { action: "print", document: "report2.pdf" });
  await queue.add("printer1", { action: "print", document: "report3.pdf" });

  // Process jobs
  queue.process("printer1", async (job, machineConfig) => {
    console.log(
      `Processing job for ${machineConfig.type} ${machineConfig.model}:`,
      job,
    );
    // Simulating work
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  // Keep the script running
  await new Promise(() => {});
}

// // Run the main function
// if (import.meta.main) {
//   main().catch(console.error);
// }
