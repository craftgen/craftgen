import { Hono } from "jsr:@hono/hono";
import { createActor, waitFor } from "npm:xstate";
import { z } from "npm:zod";

import { zValidator } from "../_shared/zValidator.ts";
import config from "./config.ts";
import { actor } from "./run.actor.ts";

const app = new Hono().basePath("/run/craftgen/math");
app.get("/", (c) => {
  return c.json({ ...config });
});

app.post(
  "/send",
  zValidator(
    "json",
    z.object({
      event: z.string(),
      params: z.object({
        inputs: z.object({
          expression: z.string(),
        }),
        senders: z.array(z.string()),
      }),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");
    console.log("BODY", body);

    const mathActor = createActor(actor, {
      id: "run",
      input: {
        ...body.params,
      },
    });

    // actor.subscribe((state) => {
    //   console.log("STATE", state);
    // });

    mathActor.start();
    await waitFor(mathActor, (state) => state.matches("complete"));
    const res = mathActor.getSnapshot();

    return c.json({ event: "Hello Event", path: c.req.routePath, body, res });
  },
);

Deno.serve(app.fetch);
