import { buildDbClient } from "../database/lib/client-org-local.ts";
import { ActorEvent } from "../database/tenant/schema/events.ts";

const token =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MjE4ODUzNzgsImlkIjoiMjA5ZDQ5YzEtNzg2Zi00MTI1LTkyMjQtMmIxODJlYjI1NjY1In0.qNRpKqXB-MHgB_n0-LIWbHhpXJZQR4WIP5pxiVtPTeSj-VF3xMSbwWvjhwuv1lo7VrS_ZVphEnQt3EZITbcNDQ";
const { client, db, queue } = buildDbClient({
  url: "libsql://org-123-necmttn.turso.io",
  authToken: token || Deno.env.get("TURSO_DB_AUTH_TOKEN"),
  useLocalReplica: true,
});

async function sendTaskToEdgeRuntime(event: ActorEvent) {
  try {
    console.log("Sending event to worker", event);
    const response = await fetch(
      "http://localhost:9000/run/@craftgen/math/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "run",
          params: {
            inputs: {
              expression: "40 + 2",
            },
            senders: [],
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to send task to Edge Runtime: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending event to worker:", error);
  }
}

async function sendEventsToWorker(events: ActorEvent[]) {
  for (const event of events) {
    await sendTaskToEdgeRuntime(event);
  }
}

await client.sync();
queue.start();

const eventStreamSubscription = queue.getEventStream().subscribe({
  next: (events) => {
    console.log(
      `Processing ${events.length} events for machine: ${events[0].machineId}`,
    );
    sendEventsToWorker(events);
  },
  error: (err) => console.error("Error in event stream:", err),
});

self.onmessage = async (e) => {
  if (e.data === "shutdown") {
    console.log("Worker received shutdown signal");
    await queue.shutdown();
    eventStreamSubscription.unsubscribe();
    self.close();
  }
};

console.log("Worker started");
