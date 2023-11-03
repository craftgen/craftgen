"use server";

import { z } from "zod";

import {
  db,
  eq,
  nodeExecutionData,
  workflowExecution,
} from "@seocraft/supabase/db";

import { action } from "@/lib/safe-action";

export const updateExecutionNode = action(
  z.object({
    id: z.string(),
    type: z.string(),
    workflowId: z.string(),
    workflowVersionId: z.string(),
    contextId: z.string(),
    workflowExecutionId: z.string(),
    projectId: z.string(),
    workflowNodeId: z.string(),
    state: z.string().transform((val) => JSON.parse(val)),
    complete: z.boolean().optional(),
  }),
  async (input) => {
    return await db.transaction(async (tx) => {
      const [executionNodeState] = await tx
        .insert(nodeExecutionData)
        .values({
          id: input.id,
          contextId: input.contextId,
          workflowExecutionId: input.workflowExecutionId,
          projectId: input.projectId,
          workflowId: input.workflowId,
          workflowVersionId: input.workflowVersionId,
          workflowNodeId: input.workflowNodeId,
          type: input.type,
          state: input.state as any,
          ...(input.complete && { completedAt: new Date() }),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: nodeExecutionData.id,
          set: {
            state: input.state as any,
            updatedAt: new Date(),
            ...(input.complete && { completedAt: new Date() }),
          },
        })
        .returning();
      await tx
        .update(workflowExecution)
        .set({
          updatedAt: new Date(),
        })
        .where(
          eq(workflowExecution.id, executionNodeState.workflowExecutionId),
        );
      return executionNodeState;
    });
  },
);
