import { STATUS_CODE } from "https://deno.land/std@0.224.0/http/status.ts";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import {
  endTime,
  setMetric,
  startTime,
  timing,
  type TimingVariables,
} from "npm:hono/timing";

import { packages } from "./package.ts";
import { run } from "./run.ts";
import { appRouter } from "../api/mod.ts";
import { trpcServer } from "./trpcServer.ts";

type Variables = TimingVariables;

const app = new Hono<{ Variables: Variables }>();
app.use(timing());
app.use(logger());
app.use(
  cors({
    origin: ["http://localhost:1420", "tauri://localhost"],
  }),
);

// Health check route
app.get("/_internal/health", (c) => {
  return c.json({ message: "ok" }, STATUS_CODE.OK);
});

// Metric route
app.get("/_internal/metric", async (c) => {
  const metric = await EdgeRuntime.getRuntimeMetrics();
  return c.json(metric);
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  }),
);

console.log("main function started");

const routes = app.route("/package", packages).route("/run", run);
export type AppType = typeof routes;
Deno.serve({ port: 8787 }, routes.fetch);

// Deno.serve(async (req: Request) => {
//   const headers = new Headers({
//     "Content-Type": "application/json",
//   });
//   if (req.headers.get("origin")?.includes("http://localhost:1420")) {
//     headers.set("Access-Control-Allow-Origin", "http://localhost:1420");
//   }
//   if (req.headers.get("origin")?.includes("tauri://localhost")) {
//     headers.set("Access-Control-Allow-Origin", "tauri://localhost");
//   }

//   const url = new URL(req.url);
//   const { pathname } = url;

//   // handle health checks
//   if (pathname === "/_internal/health") {
//     return new Response(JSON.stringify({ message: "ok" }), {
//       status: STATUS_CODE.OK,
//       headers,
//     });
//   }

//   if (pathname === "/_internal/metric") {
//     const metric = await EdgeRuntime.getRuntimeMetrics();
//     return Response.json(metric);
//   }

//   // NOTE: You can test WebSocket in the main worker by uncommenting below.
//   // if (pathname === '/_internal/ws') {
//   // 	const upgrade = req.headers.get("upgrade") || "";

//   // 	if (upgrade.toLowerCase() != "websocket") {
//   // 		return new Response("request isn't trying to upgrade to websocket.");
//   // 	}

//   // 	const { socket, response } = Deno.upgradeWebSocket(req);

//   // 	socket.onopen = () => console.log("socket opened");
//   // 	socket.onmessage = (e) => {
//   // 		console.log("socket message:", e.data);
//   // 		socket.send(new Date().toString());
//   // 	};

//   // 	socket.onerror = e => console.log("socket errored:", e.message);
//   // 	socket.onclose = () => console.log("socket closed");

//   // 	return response; // 101 (Switching Protocols)
//   // }

//   const path_parts = pathname.split("/");
//   const service_name = path_parts[1];

//   if (!service_name || service_name === "") {
//     const error = { msg: "missing function name in request" };
//     return new Response(JSON.stringify(error), {
//       status: STATUS_CODE.BadRequest,
//       headers: { "Content-Type": "application/json" },
//     });
//   }

//   const serviceBaseDir = Deno.env.get("SERVICE_BASE_DIR")!;
//   const servicePath = `${serviceBaseDir}/${service_name}`;
//   // const servicePath = `/home/deno/functions/${service_name}`;
//   console.error(`serving the request with ${servicePath}`);

//   // console.log(`Current Directory: ${Deno.cwd()}`);
//   // console.log(
//   //   `Current Directory: ${JSON.stringify(
//   //     // Deno.readDirSync("/Users/necmttn/Projects/craftgen/apps/web/src/content"),
//   //   )}`,
//   // );

//   const createWorker = async (params: { moduleCode?: string }) => {
//     const memoryLimitMb = 150;
//     const workerTimeoutMs = 5 * 60 * 1000;
//     const noModuleCache = false;

//     // you can provide an import map inline
//     // const inlineImportMap = {
//     //   imports: {
//     //     "std/": "https://deno.land/std@0.131.0/",
//     //     "cors": "./examples/_shared/cors.ts"
//     //   }
//     // }

//     // const importMapPath = `data:${encodeURIComponent(JSON.stringify(importMap))}?${encodeURIComponent('/home/deno/functions/test')}`;
//     const importMapPath = null;
//     const envVarsObj = Deno.env.toObject();
//     const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);
//     const forceCreate = true;
//     const netAccessDisabled = false;

//     // load source from an eszip
//     //const maybeEszip = await Deno.readFile('./bin.eszip');
//     //const maybeEntrypoint = 'file:///src/index.ts';

//     // const maybeEntrypoint = 'file:///src/index.ts';
//     // or load module source from an inline module

//     const maybeModuleCode = `
//     const moduleCodeWithTests = \`
//     import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
//     export default interface Person {
//       firstName: string;
//       lastName: string;
//     }

//     export function sayHello(p: Person): string {
//       return "Hello, " + p.firstName + "!";
//     }

//     Deno.test("sayHello function", () => {
//       const grace: Person = {
//         lastName: "Hopper",
//         firstName: "Grace",
//       };

//       assertEquals("Hello, Grace 2!", sayHello(grace));
//     });
//     console.log(sayHello({ firstName: "Grace", lastName: "Hopper" }));
//     \`;
//       Deno.serve((req) => new Response(moduleCodeWithTests));
//       `;

//     //k
//     const cpuTimeSoftLimitMs = 10000;
//     const cpuTimeHardLimitMs = 20000;

//     return await EdgeRuntime.userWorkers.create({
//       servicePath,
//       memoryLimitMb,
//       workerTimeoutMs,
//       noModuleCache,
//       importMapPath,
//       envVars,
//       forceCreate,
//       netAccessDisabled,
//       cpuTimeSoftLimitMs,
//       cpuTimeHardLimitMs,

//       // maybeEszip,
//       // maybeEntrypoint,
//       maybeModuleCode: maybeModuleCode,
//     });
//   };

//   const callWorker = async () => {
//     try {
//       // If a worker for the given service path already exists,
//       // it will be reused by default.
//       // Update forceCreate option in createWorker to force create a new worker for each request.

//       let worker;
//       if (req.method === "POST") {
//         const body = await req.json();
//         worker = await createWorker({ moduleCode: body.moduleCode });
//       } else {
//         worker = await createWorker({});
//       }
//       const controller = new AbortController();

//       const signal = controller.signal;
//       // Optional: abort the request after a timeout
//       //setTimeout(() => controller.abort(), 2 * 60 * 1000);

//       return await worker.fetch(req, { signal });
//     } catch (e) {
//       console.error("THE ERROR:", e);

//       if (e instanceof Deno.errors.WorkerRequestCancelled) {
//         headers.append("Connection", "close");

//         // XXX(Nyannyacha): I can't think right now how to re-poll
//         // inside the worker pool without exposing the error to the
//         // surface.

//         // It is satisfied when the supervisor that handled the original
//         // request terminated due to reaches such as CPU time limit or
//         // Wall-clock limit.
//         //
//         // The current request to the worker has been canceled due to
//         // some internal reasons. We should repoll the worker and call
//         // `fetch` again.

//         // return await callWorker();
//       }

//       const error = { msg: e.toString() };
//       return new Response(JSON.stringify(error), {
//         status: STATUS_CODE.InternalServerError,
//         headers,
//       });
//     }
//   };
//   return callWorker();
// });
