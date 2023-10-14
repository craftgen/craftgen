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
    state: z.string().transform((val) => JSON.parse(val)),
    complete: z.boolean().optional(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      const [executionNodeState] = await tx
        .update(nodeExecutionData)
        .set({
          state: params.state as any,
          ...(params.complete && { completedAt: new Date() }),
          updatedAt: new Date(),
        })
        .where(eq(nodeExecutionData.id, params.id))
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
