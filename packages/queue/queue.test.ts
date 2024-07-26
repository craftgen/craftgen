import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";

import { DenoSQLiteQueueDatabase } from "./db.ts";
import { DynamicQueue } from "./index.ts";

const TEST_DB_PATH = "./test_queue.db";

async function cleanupTestDb() {
  try {
    await Deno.remove(TEST_DB_PATH);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      console.error("Error cleaning up test database:", error);
    }
  }
}

Deno.test("DynamicQueue", async (t) => {
  await cleanupTestDb();

  const queueDb = new DenoSQLiteQueueDatabase(TEST_DB_PATH);
  const queue = new DynamicQueue(queueDb, 5);

  await t.step("createMachine", async () => {
    await queue.createMachine("testMachine", {
      type: "test",
      model: "TEST123",
    });
    const machine = await queue.getMachine("testMachine");
    assertExists(machine);
    assertEquals(machine.id, "testMachine");
    assertEquals(machine.config, { type: "test", model: "TEST123" });
  });

  await t.step("add and process job", async () => {
    const jobId = await queue.add("testMachine", {
      action: "test",
      data: "testData",
    });
    assertExists(jobId);

    let processedJob: any = null;
    await new Promise<void>((resolve) => {
      queue.process("testMachine", async (job, machineConfig) => {
        processedJob = job;
        assertEquals(job.action, "test");
        assertEquals(job.data, "testData");
        assertEquals(machineConfig.type, "test");
        assertEquals(machineConfig.model, "TEST123");
        resolve();
      });
    });

    assertExists(processedJob);
  });

  await t.step("updateMachineConfig", async () => {
    await queue.updateMachineConfig("testMachine", {
      type: "updated",
      model: "UPDATED456",
    });
    const machine = await queue.getMachine("testMachine");
    assertExists(machine);
    assertEquals(machine.config, { type: "updated", model: "UPDATED456" });
  });

  await t.step("deleteMachine", async () => {
    await queue.deleteMachine("testMachine");
    const machine = await queue.getMachine("testMachine");
    assertEquals(machine, null);
  });

  // await cleanupTestDb();
});
