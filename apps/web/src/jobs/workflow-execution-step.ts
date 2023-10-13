import { client } from "@/trigger";
import { z } from "zod";

const schema = z.object({
  workflowSlug: z.string(),
  projectSlug: z.string(),
  executionId: z.string(),
  version: z.number(),
  workflowNodeId: z.string(),
});

const name = "workflow.execution.step" as const;

export const WORKFLOW_NODE_TRIGGER = {
  name,
  schema,
  send: async (payload: z.infer<typeof schema>) => {
    await client.sendEvent({
      name,
      payload,
    });
  },
};
