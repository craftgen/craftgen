import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { type TimingVariables } from "npm:hono/timing";

import { buildDbClient } from "../database/lib/client-org-local.ts";
import { ProcessingEvent } from "../database/tenant/queue.ts";
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
  useLocalReplica: false,
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
// queue.start();
async function sendTaskToEdgeRuntime(event: ProcessingEvent) {
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
}

const eventStreamSubscription = queue.getEventStream().subscribe({
  next: (event) => {
    console.log(`Processing event for machine: ${event.machineId}`);
    sendTaskToEdgeRuntime(event)
      .then(async () => {
        await queue.completeEvent(event.id, true);
      })
      .catch(async (error) => {
        console.error(`Error processing event ${event.id}:`, error);
        await queue.completeEvent(event.id, false);
      });
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
