"use server";

import { action } from "@/lib/safe-action";
import {
  db,
  nodeExecutionData,
  workflowExecution,
  eq,
} from "@seocraft/supabase/db";
import { z } from "zod";

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
  async (params) => {
    return await db.transaction(async (tx) => {
      const [executionNodeState] = await tx
        .insert(nodeExecutionData)
        .values({
          id: params.id,
          contextId: params.contextId,
          workflowExecutionId: params.workflowExecutionId,
          projectId: params.projectId,
          workflowId: params.workflowId,
          workflowVersionId: params.workflowVersionId,
          workflowNodeId: params.workflowNodeId,
          type: params.type,
          state: params.state as any,
          ...(params.complete && { completedAt: new Date() }),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: nodeExecutionData.id,
          set: {
            state: params.state as any,
            updatedAt: new Date(),
            ...(params.complete && { completedAt: new Date() }),
          },
        })
        .returning();
      await tx
        .update(workflowExecution)
        .set({
          updatedAt: new Date(),
        })
        .where(
          eq(workflowExecution.id, executionNodeState.workflowExecutionId)
        );
      return executionNodeState;
    });
  }
);
