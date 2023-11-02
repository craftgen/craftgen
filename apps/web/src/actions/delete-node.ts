"use server";

import { action } from "@/lib/safe-action";
import {
  db,
  workflowVersion,
  nodeExecutionData,
  workflowNode,
  context,
  and,
  eq,
} from "@seocraft/supabase/db";
import { z } from "zod";

export const deleteNode = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    data: z.object({
      id: z.string(),
    }),
  }),
  async (input) => {
    console.log("deleteNode", input);
    await db.transaction(async (tx) => {
      // TODO check this. Delete context if it's not attached to any published version.
      const [version] = await tx
        .select({
          publishedAt: workflowVersion.publishedAt,
        })
        .from(workflowVersion)
        .where(eq(workflowVersion.id, input.workflowVersionId))
        .limit(1);
      if (!version.publishedAt) {
        // delete all the execution data as well.
        await tx
          .delete(nodeExecutionData)
          .where(
            and(
              eq(nodeExecutionData.workflowId, input.workflowId),
              eq(nodeExecutionData.workflowVersionId, input.workflowVersionId),
              eq(nodeExecutionData.workflowNodeId, input.data.id)
            )
          );
      }
      const [node] = await tx
        .delete(workflowNode)
        .where(
          and(
            eq(workflowNode.workflowId, input.workflowId),
            eq(workflowNode.workflowVersionId, input.workflowVersionId),
            eq(workflowNode.id, input.data.id)
          )
        )
        .returning();
      await tx.delete(context).where(eq(context.id, node.contextId)); // TODO: soft delete
    });
  }
);
