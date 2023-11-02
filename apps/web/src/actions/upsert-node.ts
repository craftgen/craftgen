"use server";

import { action } from "@/lib/safe-action";
import { db, context, workflowNode, eq } from "@seocraft/supabase/db";
import { z } from "zod";

export const upsertNode = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    projectId: z.string(),
    data: z.object({
      id: z.string(),
      contextId: z.string(),
      context: z.string().transform((val) => JSON.parse(val)),
      type: z.string(),
      width: z.number(),
      height: z.number(),
      color: z.string(),
      label: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
    }),
  }),
  async (params): Promise<void> => {
    console.log("saveNode", params);
    await db.transaction(async (tx) => {
      const [contextOfTheNode] = await tx
        .select()
        .from(context)
        .where(eq(context.id, params.data.contextId))
        .limit(1);
      /// This is happens when user deletes the node and then tries to undo it.
      if (!contextOfTheNode) {
        // reincarnate the context
        const [contextUnit] = await tx
          .insert(context)
          .values({
            id: params.data.contextId,
            project_id: params.projectId,
            type: params.data.type,
            state: {},
          })
          .returning();
      }
      await tx
        .insert(workflowNode)
        .values({
          id: params.data.id,
          workflowId: params.workflowId,
          workflowVersionId: params.workflowVersionId,
          projectId: params.projectId,
          contextId: params.data.contextId,
          type: params.data.type,
          width: params.data.width,
          height: params.data.height,
          color: params.data.color,
          label: params.data.label,
          position: params.data.position,
        })
        .onConflictDoUpdate({
          target: workflowNode.id,
          set: {
            contextId: params.data.contextId,
            type: params.data.type,
            width: params.data.width,
            height: params.data.height,
            color: params.data.color,
            label: params.data.label,
            position: params.data.position,
          },
        });
    });
  }
);
