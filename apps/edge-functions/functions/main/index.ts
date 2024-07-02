import { STATUS_CODE } from "https://deno.land/std@0.224.0/http/status.ts";

console.log("main function started");

Deno.serve(async (req: Request) => {
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  if (req.headers.get("origin")?.includes("http://localhost:1420")) {
    headers.set("Access-Control-Allow-Origin", "http://localhost:1420");
  }
  if (req.headers.get("origin")?.includes("tauri://localhost")) {
    headers.set("Access-Control-Allow-Origin", "tauri://localhost");
  }

  const url = new URL(req.url);
  const { pathname } = url;

  // handle health checks
  if (pathname === "/_internal/health") {
    return new Response(JSON.stringify({ message: "ok" }), {
      status: STATUS_CODE.OK,
      headers,
    });
  }

  if (pathname === "/_internal/metric") {
    const metric = await EdgeRuntime.getRuntimeMetrics();
    return Response.json(metric);
  }

  const path_parts = pathname.split("/");
  const service_name = path_parts[1];

  if (!service_name || service_name === "") {
    const error = { msg: "missing function name in request" };
    return new Response(JSON.stringify(error), {
      status: STATUS_CODE.BadRequest,
      headers: { "Content-Type": "application/json" },
    });
  }

  const serviceBaseDir = Deno.env.get("SERVICE_BASE_DIR")!;

  const servicePath = `${serviceBaseDir}/${service_name}`;
  // const servicePath = `/home/deno/functions/${service_name}`;
  console.error(`serving the request with ${servicePath}`);

  // console.log(`Current Directory: ${Deno.cwd()}`);
  // console.log(
  //   `Current Directory: ${JSON.stringify(
  //     // Deno.readDirSync("/Users/necmttn/Projects/craftgen/apps/web/src/content"),
  //   )}`,
  // );

  const createWorker = async (params: { moduleCode?: string }) => {
    const memoryLimitMb = 150;
    const workerTimeoutMs = 5 * 60 * 1000;
    const noModuleCache = false;

    // you can provide an import map inline
    // const inlineImportMap = {
    //   imports: {
    //     "std/": "https://deno.land/std@0.131.0/",
    //     "cors": "./examples/_shared/cors.ts"
    //   }
    // }

    // const importMapPath = `data:${encodeURIComponent(JSON.stringify(importMap))}?${encodeURIComponent('/home/deno/functions/test')}`;
    const importMapPath = null;
    const envVarsObj = Deno.env.toObject();
    const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);
    const forceCreate = true;
    const netAccessDisabled = false;

    // load source from an eszip
    //const maybeEszip = await Deno.readFile('./bin.eszip');
    //const maybeEntrypoint = 'file:///src/index.ts';

    // const maybeEntrypoint = 'file:///src/index.ts';
    // or load module source from an inline module

    const maybeModuleCode = `
      import ollama from 'npm:ollama/browser'
      // const response = "hello" + STATUS_CODE.Accepted 
      const response = await ollama.chat({
        model: 'llama2',
        messages: [{ role: 'user', content: 'Why is the sky blue?' }],
      })
      console.log(response.message.content)

      Deno.serve((req) => new Response(response.message.content));
      `;
    //
    const cpuTimeSoftLimitMs = 10000;
    const cpuTimeHardLimitMs = 20000;

    return await EdgeRuntime.userWorkers.create({
      servicePath,
      memoryLimitMb,
      workerTimeoutMs,
      noModuleCache,
      importMapPath,
      envVars,
      forceCreate,
      netAccessDisabled,
      cpuTimeSoftLimitMs,
      cpuTimeHardLimitMs,
      // maybeEszip,
      // maybeEntrypoint,
      maybeModuleCode: params.moduleCode,
    });
  };

  const callWorker = async () => {
    try {
      // If a worker for the given service path already exists,
      // it will be reused by default.
      // Update forceCreate option in createWorker to force create a new worker for each request.

      const body = await req.json();
      const worker = await createWorker({ moduleCode: body.moduleCode });
      const controller = new AbortController();

      const signal = controller.signal;
      // Optional: abort the request after a timeout
      //setTimeout(() => controller.abort(), 2 * 60 * 1000);

      return await worker.fetch(req, { signal });
    } catch (e) {
      console.error("THE ERROR:", e);

      if (e instanceof Deno.errors.WorkerRequestCancelled) {
        headers.append("Connection", "close");

        // XXX(Nyannyacha): I can't think right now how to re-poll
        // inside the worker pool without exposing the error to the
        // surface.

        // It is satisfied when the supervisor that handled the original
        // request terminated due to reaches such as CPU time limit or
        // Wall-clock limit.
        //
        // The current request to the worker has been canceled due to
        // some internal reasons. We should repoll the worker and call
        // `fetch` again.

        // return await callWorker();
      }

      const error = { msg: e.toString() };
      return new Response(JSON.stringify(error), {
        status: STATUS_CODE.InternalServerError,
        headers,
      });
    }
  };
  return callWorker();
});
