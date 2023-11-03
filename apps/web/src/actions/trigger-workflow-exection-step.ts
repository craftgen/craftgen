"use server";

import { z } from "zod";

import { WORKFLOW_NODE_TRIGGER } from "@/jobs/workflow-execution-step";
import { action } from "@/lib/safe-action";

export const triggerWorkflowExecutionStep = action(
  z.object({
    executionId: z.string(),
    workflowNodeId: z.string(),
    workflowSlug: z.string(),
    projectSlug: z.string(),
    version: z.number(),
  }),
  async (params) => {
    await WORKFLOW_NODE_TRIGGER.send(params);
  },
);
