"use server";

import { db, workflowNode, eq } from "@seocraft/supabase/db";

export const updateNodeMetadata = async (params: {
  id: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  label?: string;
}): Promise<void> => {
  console.log("nodeMeta", params);
  await db
    .update(workflowNode)
    .set({
      ...(params.size && params.size),
      ...(params.position && { position: params.position }),
      ...(params.label && { label: params.label }),
    })
    .where(eq(workflowNode.id, params.id));
};
