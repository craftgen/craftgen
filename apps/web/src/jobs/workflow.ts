import { eventTrigger } from "@trigger.dev/sdk";
import { client } from "@/trigger";
import { z } from "zod";
import {
  createExecution,
  getWorkflow,
} from "@/app/(dashboard)/project/[projectSlug]/playground/[playgroundSlug]/action";

client.defineJob({
  id: "execute-workflow",
  name: "Execute Workflow",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "workflow.execute",
    schema: z.object({
      workflowSlug: z.string(),
      projectSlug: z.string(),
      version: z.string(),
      input: z.any(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const workflow = await getWorkflow({
      workflowSlug: payload.workflowSlug,
      projectSlug: payload.projectSlug,
      version: Number(payload.version),
    });

    if (!workflow.data) {
      throw new Error("Workflow not found");
    }

    createExecution({
      workflowId: workflow.data.id,
      workflowVersionId: workflow.data.version.id,
    });
  },
});

client.defineJob({
  id: "execute-workflow-step",
  name: "Execute Workflow",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "workflow.execute",
    schema: z.object({
      workflowSlug: z.string(),
      projectSlug: z.string(),
      version: z.string(),
      workflowNodeId: z.string(),
      workflowExecutionId: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const workflow = await getWorkflow({
      workflowSlug: payload.workflowSlug,
      projectSlug: payload.projectSlug,
      version: Number(payload.version),
      executionId: payload.workflowExecutionId,
    });

    if (!workflow.data) {
      throw new Error("Workflow not found");
    }
  },
});
