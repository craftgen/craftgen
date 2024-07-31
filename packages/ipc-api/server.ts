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

queue.start();

const someAsyncProcessingFunction = async (event: ProcessingEvent) => {
  // Simulate some async processing
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

const eventStreamSubscription = queue.getEventStream().subscribe({
  next: async (event) => {
    console.log(`Processing event for machine: ${event.machineId}`);
    try {
      // Implement your processing logic here
      await someAsyncProcessingFunction(event);
      await queue.completeEvent(event.id, true);
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      await queue.completeEvent(event.id, false);
    }
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
