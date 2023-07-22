"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { db, eq, nodeData, playground } from "@turboseo/supabase/db";
import { cookies } from "next/headers";
import type { Edge, Node } from "reactflow";

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

export const createNode = async (params: { playgroundId: string }) => {
  const supabase = createServerActionClient({ cookies });

  const nodes = await db
    .insert(nodeData)
    .values({
      playground_id: params.playgroundId,
      type: "node",
      data: {},
    })
    .returning();

  return nodes[0];
};
