import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { type TimingVariables } from "npm:hono/timing";

import { buildDbClient } from "../database/lib/client-org-local.ts";
import { appRouter } from "./router/index.ts";
import { trpcServer } from "./trpcServer.ts";

type Variables = TimingVariables;

const app = new Hono<{ Variables: Variables }>();
app.use(
  cors({
    origin: ["http://localhost:1420", "tauri://localhost"],
  }),
);

const { client, db, queue } = buildDbClient({
  url: Deno.env.get("TURSO_DB_URL") || "",
  authToken: Deno.env.get("TURSO_DB_AUTH_TOKEN") || "",
  useLocalReplica: Deno.env.get("USE_LOCAL_REPLICA") === "true",
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (opts) => {
      return {
        session: null,
        db,
        client,
        queue,
      };
    },
  }),
);

// Start the worker
const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
  type: "module",
});

// Pass the database connection details to the worker
worker.postMessage({
  type: "init",
  data: {
    url: Deno.env.get("TURSO_DB_URL") || "",
    authToken: Deno.env.get("TURSO_DB_AUTH_TOKEN") || "",
    useLocalReplica: Deno.env.get("USE_LOCAL_REPLICA") === "true",
  },
});

console.log("Worker started");

// Handle graceful shutdown
Deno.addSignalListener("SIGINT", async () => {
  console.log("Received SIGINT. Graceful shutdown start");
  worker.postMessage("shutdown");
  worker.addEventListener("close", () => {
    console.log("Worker closed");
    Deno.exit();
  });
});

Deno.serve({ port: 8787 }, app.fetch);
