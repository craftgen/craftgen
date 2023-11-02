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
  async (input): Promise<void> => {
    console.log("saveNode", input);
    await db.transaction(async (tx) => {
      const [contextOfTheNode] = await tx
        .select()
        .from(context)
        .where(eq(context.id, input.data.contextId))
        .limit(1);
      /// This is happens when user deletes the node and then tries to undo it.
      if (!contextOfTheNode) {
        // reincarnate the context
        const [contextUnit] = await tx
          .insert(context)
          .values({
            id: input.data.contextId,
            project_id: input.projectId,
            type: input.data.type,
            state: {},
          })
          .returning();
      }
      await tx
        .insert(workflowNode)
        .values({
          id: input.data.id,
          workflowId: input.workflowId,
          workflowVersionId: input.workflowVersionId,
          projectId: input.projectId,
          contextId: input.data.contextId,
          type: input.data.type,
          width: input.data.width,
          height: input.data.height,
          color: input.data.color,
          label: input.data.label,
          position: input.data.position,
        })
        .onConflictDoUpdate({
          target: workflowNode.id,
          set: {
            contextId: input.data.contextId,
            type: input.data.type,
            width: input.data.width,
            height: input.data.height,
            color: input.data.color,
            label: input.data.label,
            position: input.data.position,
          },
        });
    });
  }
);
