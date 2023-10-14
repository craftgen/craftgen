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
  async (params) => {
    console.log("deleteNode", params);
    await db.transaction(async (tx) => {
      // TODO check this. Delete context if it's not attached to any published version.
      const [version] = await tx
        .select({
          publishedAt: workflowVersion.publishedAt,
        })
        .from(workflowVersion)
        .where(eq(workflowVersion.id, params.workflowVersionId))
        .limit(1);
      if (!version.publishedAt) {
        // delete all the execution data as well.
        await tx
          .delete(nodeExecutionData)
          .where(
            and(
              eq(nodeExecutionData.workflowId, params.workflowId),
              eq(nodeExecutionData.workflowVersionId, params.workflowVersionId),
              eq(nodeExecutionData.workflowNodeId, params.data.id)
            )
          );
      }
      const [node] = await tx
        .delete(workflowNode)
        .where(
          and(
            eq(workflowNode.workflowId, params.workflowId),
            eq(workflowNode.workflowVersionId, params.workflowVersionId),
            eq(workflowNode.id, params.data.id)
          )
        )
        .returning();
      await tx.delete(context).where(eq(context.id, node.contextId)); // TODO: soft delete
    });
  }
);
