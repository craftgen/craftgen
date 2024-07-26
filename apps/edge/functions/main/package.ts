import { Hono } from "npm:hono";
import { z } from "npm:zod";

import { getDB } from "./surreal/db.ts";
import { zValidator } from "./zValidator.ts";

export const packages = new Hono()
  .get("/", async (c) => {
    const db = await getDB();
    const packages = await db.select("package");

    return c.json({ packages });
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        projectSlug: z.string(),
        moduleSlug: z.string(),
        code: z.string(),
      }),
    ),
    async (c) => {
      const input = c.req.valid("json");
      const db = await getDB();
      const res = await db.create("package", {
        id: {
          project: input.projectSlug,
          module: input.moduleSlug,
        },
        code: input.code,
      });

      return c.json(
        {
          package: res,
        },
        201,
      );
    },
  )
  .get(
    "/:projectSlug/:moduleName/:version{[0-9]+\\.[0-9]+\\.[0-9]+}?",
    zValidator(
      "param",
      z.object({
        projectSlug: z.string().optional(),
        moduleName: z.string().optional(),
        version: z
          .string()
          .regex(/^\d+\.\d+\.\d+$/)
          .optional(),
      }),
    ),
    (c) => {
      const { projectSlug, moduleName, version } = c.req.valid("param");
      return c.json({
        projectSlug,
        moduleName,
        version: version || "latest",
      });
    },
  );
