"use server";

import { db, eq, workflowNode } from "@craftgen/db/db";

export const updateNodeMetadata = async (input: {
  id: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  label?: string;
}): Promise<void> => {
  console.log("nodeMeta", input);
  await db
    .update(workflowNode)
    .set({
      ...(input.size && input.size),
      ...(input.position && { position: input.position }),
      ...(input.label && { label: input.label }),
    })
    .where(eq(workflowNode.id, input.id));
};
