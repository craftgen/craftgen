import { STATUS_CODE } from "https://deno.land/std@0.224.0/http/status.ts";
import { Hono } from "npm:hono";
import { z } from "npm:zod";

import { createWorker } from "./worker.ts";
import { zValidator } from "./zValidator.ts";

export const run = new Hono().on(
  ["GET", "POST"],
  "/:projectSlug/:moduleName/*",
  zValidator(
    "param",
    z.object({
      projectSlug: z.string(),
      moduleName: z.string(),
    }),
  ),
  async (c) => {
    const module = c.req.param();

    try {
      const serviceBaseDir = Deno.env.get("SERVICE_BASE_DIR")!;
      const service_name = `${module.projectSlug}/${module.moduleName}`;
      const servicePath = `${serviceBaseDir}/${service_name}`;
      console.log("SERVICE PATH", {
        serviceBaseDir,
        service_name,
        servicePath,
      });

      const worker = await createWorker({
        servicePath,
      });
      const controller = new AbortController();
      const signal = controller.signal;

      // Optional: abort the request after a timeout
      //setTimeout(() => controller.abort(), 2 * 60 * 1000);

      // const headers = new Headers(c.req.header());
      return await worker.fetch(c.req.raw, signal);
    } catch (e) {
      console.error("THE ERROR:", e);
      if (e instanceof Deno.errors.WorkerRequestCancelled) {
        c.status(STATUS_CODE.RequestTimeout);
        return c.json({ message: "Cancelled" });
      }

      c.status(STATUS_CODE.InternalServerError);
      return c.json({ message: e.toString() });
    }
  },
);
