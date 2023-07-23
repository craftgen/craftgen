"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import {
  db,
  eq,
  nodeData,
  nodeToPlayground,
  playground,
} from "@turboseo/supabase/db";
import { cookies } from "next/headers";
import type { Edge, Node } from "reactflow";
import { NodeTypes } from "./nodes";

export const savePlayground = async (params: {
  projectSlug: string;
  playgroundId: string;
  nodes: Node[];
  edges: Edge[];
}) => {
  console.log(JSON.stringify(params));
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  await db
    .update(playground)
    .set({
      edges: params.edges,
      nodes: params.nodes,
    })
    .where(eq(playground.id, params.playgroundId));
};

export const createNode = async (params: {
  playgroundId: string;
  projectSlug: string;
  type: NodeTypes;
}) => {
  const supabase = createServerActionClient({ cookies });

  const project = await db.query.project.findFirst({
    where: (project, { eq }) => eq(project.slug, params.projectSlug),
  });
  if (!project) {
    throw new Error("Project not found");
  }
  return await db.transaction(async (tx) => {
    const nodes = await tx
      .insert(nodeData)
      .values({
        project_id: project?.id,
        type: params.type,
        data: {},
      })
      .returning();

    await tx.insert(nodeToPlayground).values({
      node_id: nodes[0].id,
      playground_id: params.playgroundId,
    });
    return nodes[0];
  });
};
