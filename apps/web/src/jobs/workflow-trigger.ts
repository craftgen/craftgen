import { client } from "@/trigger";
import { z } from "zod";

const schema = z.object({
  workflowSlug: z.string(),
  projectSlug: z.string(),
  executionId: z.string(),
  version: z.number(),
  workflowNodeId: z.string(),
  values: z.any(),
});
const name = "workflow.trigger" as const;
export const WORKFLOW_TRIGGER = {
  name,
  schema,
  send: async (payload: z.infer<typeof schema>) => {
    await client.sendEvent({
      name,
      payload,
    });
  },
};
