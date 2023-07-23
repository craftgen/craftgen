"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import {
  db,
  eq,
  inArray,
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
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  await db.transaction(async (tx) => {
    const project = await tx.query.project.findFirst({
      where: (project, { eq }) => eq(project.slug, params.projectSlug),
    });
    if (!project) {
      throw new Error("Project not found");
    }
    await tx
      .update(playground)
      .set({
        edges: params.edges,
        nodes: params.nodes,
      })
      .where(eq(playground.id, params.playgroundId));

    const playgroundNodes = await tx.query.nodeToPlayground.findMany({
      where: (nodeToPlayground, { eq }) =>
        eq(nodeToPlayground.playground_id, params.playgroundId),
    });

    const nodeToPlaygroundsDelete = playgroundNodes.filter((node) => {
      return !params.nodes.find((n) => n.id === node.node_id);
    });

    if (nodeToPlaygroundsDelete.length > 0) {
      await tx.delete(nodeToPlayground).where(
        inArray(
          nodeToPlayground.id,
          nodeToPlaygroundsDelete.map((node) => node.id)
        )
      );
      // Delete orphaned nodes
      const orphanNodes = nodeToPlaygroundsDelete.filter(async (node) => {
        const relation = await tx.query.nodeToPlayground.findMany({
          where: (nodeToPlayground, { eq }) =>
            eq(nodeToPlayground.node_id, node.id),
        });
        return relation.length === 0;
      });
      if (orphanNodes.length > 0) {
        await tx.delete(nodeData).where(
          inArray(
            nodeData.id,
            orphanNodes.map((node) => node.node_id)
          )
        );
      }
    }
  });
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
