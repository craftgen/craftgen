import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { type TimingVariables } from "npm:hono/timing";

import { buildDbClient } from "../database/lib/client-org-local.ts";
import { ActorEvent } from "../database/tenant/schema/events.ts";
import { appRouter } from "./router/index.ts";
import { trpcServer } from "./trpcServer.ts";

type Variables = TimingVariables;

const app = new Hono<{ Variables: Variables }>();
app.use(
  cors({
    origin: ["http://localhost:1420", "tauri://localhost"],
  }),
);

const token =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MjE4ODUzNzgsImlkIjoiMjA5ZDQ5YzEtNzg2Zi00MTI1LTkyMjQtMmIxODJlYjI1NjY1In0.qNRpKqXB-MHgB_n0-LIWbHhpXJZQR4WIP5pxiVtPTeSj-VF3xMSbwWvjhwuv1lo7VrS_ZVphEnQt3EZITbcNDQ";
const { client, db, queue } = buildDbClient({
  url: "libsql://org-123-necmttn.turso.io",
  authToken: token || Deno.env.get("TURSO_DB_AUTH_TOKEN"),
  useLocalReplica: true,
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (opts) => {
      try {
        await client.sync();
      } catch (e) {
        console.log("ERROR", e);
      }
      return {
        queue,
        session: null,
        db,
        client,
      };
    },
  }),
);

// await client.sync();
queue.start();
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
  // Send the batch of events to the worker for processing
  for (const event of events) {
    await sendTaskToEdgeRuntime(event);
  }
}

const eventStreamSubscription = queue.getEventStream().subscribe({
  next: (events) => {
    console.log(
      `Processing ${events.length} events for machine: ${events[0].machineId}`,
    );
    // Send the batch of events to the worker for processing
    sendEventsToWorker(events);
  },
  error: (err) => console.error("Error in event stream:", err),
});

// To gracefully shut down (e.g., on process exit)

Deno.addSignalListener("SIGINT", async () => {
  console.log("Received SIGINT. Graceful shutdown start");
  await queue.shutdown();
  eventStreamSubscription.unsubscribe();
  Deno.exit();
});

Deno.serve({ port: 8787 }, app.fetch);
