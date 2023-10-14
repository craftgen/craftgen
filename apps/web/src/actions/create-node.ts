"use server";

import { NodeTypes, nodesMeta } from "@/core/types";
import { action } from "@/lib/safe-action";
import { db, context, workflowNode } from "@seocraft/supabase/db";
import { z } from "zod";

export const createNode = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    projectSlug: z.string(),
    type: z.custom<NodeTypes>(),
    context: z.any().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
  }),
  async (params) => {
    console.log("createNodeInDB", params);
    const project = await db.query.project.findFirst({
      where: (project, { eq }) => eq(project.slug, params.projectSlug),
    });
    if (!project) {
      throw new Error("Project not found");
    }
    return await db.transaction(async (tx) => {
      const [contextUnit] = await tx
        .insert(context)
        .values({
          project_id: project?.id,
          type: params.type,
          ...(params.context && { state: params.context }),
        })
        .returning();
      const workflowNodeUnit = await tx
        .insert(workflowNode)
        .values({
          projectId: project?.id,
          workflowId: params.workflowId,
          contextId: contextUnit.id,
          color: "default",
          height: params.height || 200,
          width: params.width || 200,
          label: nodesMeta[params.type].name,
          position: { x: 0, y: 0 },
          workflowVersionId: params.workflowVersionId,
          type: params.type,
        })
        .returning();
      return tx.query.workflowNode.findFirst({
        where: (workflowNode, { eq }) =>
          eq(workflowNode.id, workflowNodeUnit[0].id),
        with: {
          context: {
            columns: {
              state: true,
            },
          },
        },
      });
    });
  }
);
