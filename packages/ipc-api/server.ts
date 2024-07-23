import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import {
  endTime,
  setMetric,
  startTime,
  timing,
  type TimingVariables,
} from "npm:hono/timing";

import { buildDbClient } from "../database/lib/client-org-local.ts";
import { appRouter } from "./router/index.ts";
import { trpcServer } from "./trpcServer.ts";

type Variables = TimingVariables;

const app = new Hono<{ Variables: Variables }>();

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (opts) => {
      const token =
        "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MjE2MTgwMzEsImlkIjoiN2NiMTRkN2MtODVjYy00NWUyLWEwNTctOTA5OGJkZGQ4MTY4In0.HXvTbW-5N6Z9b6PE8I3HfugXLou0lvS0HJ7_pXiaxE6fveyycIUJf6zsMo0_gtOlr7K9-trO74pmqMKSs1GGBw";
      return {
        session: null,
        db: buildDbClient({
          url: "libsql://org-123-necmttn.turso.io",
          authToken: token || Deno.env.get("TURSO_DB_AUTH_TOKEN"),
          useLocalReplica: true,
        }),
      };
    },
  }),
);

Deno.serve({ port: 8787 }, app.fetch);
