import { createActor, waitFor } from "npm:xstate";
import { z } from "npm:zod";

import { NodeBuilder } from "../base/router.ts";
import { zValidator } from "../shared/zValidator.ts";
import config from "./config.ts";
import { actor } from "./run.actor.ts";

const app = new NodeBuilder("/run/@craftgen/math", config).addRestEndpoints(
  (app) =>
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

        const mathActor = await createActor(actor, {
          input: {
            ...body.params,
          },
        });

        mathActor.start();
        await waitFor(mathActor, (state) => state.matches("complete"));
        const res = mathActor.getSnapshot();

        return c.json({
          event: "Hello Event",
          path: c.req.routePath,
          body,
          res,
        });
      },
    ),
);

Deno.serve(app.build().fetch);
