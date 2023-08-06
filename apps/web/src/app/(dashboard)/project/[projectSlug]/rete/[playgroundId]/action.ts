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
import { NodeProps, NodeTypes } from "./playground/types";

export const getPlayground = async (params: { playgroundId: string }) => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  console.log({ params });
  return await db.query.playground.findFirst({
    where: (playground, { eq }) => eq(playground.id, params.playgroundId),
    with: {
      project: true,
    },
  });
};

export const savePlayground = async (params: {
  projectSlug: string;
  playgroundId: string;
  nodes: any[];
  edges: any[];
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
    console.log(
      JSON.stringify(
        { nodeToPlaygroundsDelete, playgroundNodes, params },
        null,
        2
      )
    );

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
      console.log({ orphanNodes });
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

export const createNodeInDB = async (params: {
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
      })
      .returning();

    await tx.insert(nodeToPlayground).values({
      node_id: nodes[0].id,
      playground_id: params.playgroundId,
    });
    return nodes[0];
  });
};
