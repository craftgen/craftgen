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

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (opts) => {
      const token =
        "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MjE4ODUzNzgsImlkIjoiMjA5ZDQ5YzEtNzg2Zi00MTI1LTkyMjQtMmIxODJlYjI1NjY1In0.qNRpKqXB-MHgB_n0-LIWbHhpXJZQR4WIP5pxiVtPTeSj-VF3xMSbwWvjhwuv1lo7VrS_ZVphEnQt3EZITbcNDQ";
      const { client, db } = buildDbClient({
        url: "libsql://org-123-necmttn.turso.io",
        authToken: token || Deno.env.get("TURSO_DB_AUTH_TOKEN"),
        useLocalReplica: true,
      });
      try {
        await client.sync();
      } catch (e) {
        console.log("ERROR", e);
      }
      return {
        session: null,
        db,
        client,
      };
    },
  }),
);

Deno.serve({ port: 8787 }, app.fetch);
