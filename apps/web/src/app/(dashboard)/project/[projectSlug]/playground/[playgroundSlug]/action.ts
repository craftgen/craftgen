"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import {
  db,
  eq,
  nodeData,
  playgroundNode,
  playground,
  and,
  dataRow,
  gt,
  projectMembers,
  playgroundEdge,
} from "@seocraft/supabase/db";
import { cookies } from "next/headers";
import { ConnProps, NodeTypes, Position } from "./playground/types";
import * as FlexLayout from "flexlayout-react";
import { action } from "@/lib/safe-action";
import { z } from "zod";

export const getPlaygroundById = async (playgroundId: string) => {
  return await db.query.playground.findFirst({
    where: (playground, { eq }) => eq(playground.id, playgroundId),
    with: {
      nodes: {
        with: {
          node: {
            columns: {
              state: true,
            },
          },
        },
      },
      edges: true,
    },
  });
};

export const getPlayground = async (params: {
  playgroundSlug: string;
  projectSlug: string;
}) => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();

  return await db.transaction(async (tx) => {
    const project = await tx.query.project.findFirst({
      where: (project, { eq }) => eq(project.slug, params.projectSlug),
      columns: {
        id: true,
      },
    });
    if (!project) {
      throw new Error("Project not found");
    }
    const userId = session?.data?.session?.user?.id;
    let readonly = true;
    if (userId) {
      const [isMember] = await tx
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, project.id),
            eq(projectMembers.userId, userId)
          )
        )
        .limit(1);
      if (isMember) {
        readonly = false;
      }
    }
    const playground = await tx.query.playground.findFirst({
      where: (playground, { eq, and }) =>
        and(
          eq(playground.slug, params.playgroundSlug),
          eq(playground.project_id, project.id)
        ),
      with: {
        project: true,
        nodes: {
          with: {
            node: {
              columns: {
                state: true,
              },
            },
          },
        },
        edges: true,
      },
    });
    if (!playground) {
      throw new Error("Playground not found");
    }
    return {
      ...playground,
      readonly,
    };
  });
};

export const getPlaygroundInputsOutputs = async (params: {
  playgroundId: string;
}) => {
  return await db.transaction(async (tx) => {
    tx.select()
      .from(playgroundNode)
      .where(
        and(
          eq(playgroundNode.playground_id, params.playgroundId),
          eq(playgroundNode.type, "Input")
        )
      );
  });
};

export const updatePlayground = async (
  playgroundId: string,
  args: {
    name: string;
    description?: string;
    public: boolean;
  }
) => {
  return await db
    .update(playground)
    .set(args)
    .where(eq(playground.id, playgroundId))
    .returning();
};

export const savePlaygroundLayout = async (params: {
  playgroundId: string;
  layout: FlexLayout.IJsonModel;
}) => {
  console.log("saving playground layout", params);
  return await db
    .update(playground)
    .set({ layout: params.layout })
    .where(eq(playground.id, params.playgroundId))
    .returning();
};

export const updateNodeMeta = async (params: {
  id: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}): Promise<void> => {
  console.log("nodeMeta", params);
  await db
    .update(playgroundNode)
    .set({
      ...(params.size && params.size),
      ...(params.position && { position: params.position }),
    })
    .where(eq(playgroundNode.id, params.id));
};

export const saveNode = async (params: {
  playgroundId: string;
  data: {
    id: string;
    type: NodeTypes;
    width: number;
    height: number;
    color: string;
    label: string;
    position: Position;
  };
}): Promise<void> => {
  console.log("saveNode", params);
  await db.transaction(async (tx) => {
    await tx.insert(playgroundNode).values({
      id: params.data.id,
      playground_id: params.playgroundId,
      type: params.data.type,
      width: params.data.width,
      height: params.data.height,
      color: params.data.color,
      label: params.data.label,
      position: params.data.position,
    });
  });
};

export const deleteNode = async (params: {
  playgroundId: string;
  data: {
    id: string;
  };
}) => {
  console.log("deleteNode", params);
  await db.transaction(async (tx) => {
    await tx
      .delete(playgroundNode)
      .where(
        and(
          eq(playgroundNode.playground_id, params.playgroundId),
          eq(playgroundNode.id, params.data.id)
        )
      );
    await tx.delete(nodeData).where(eq(nodeData.id, params.data.id)); // TODO check this.
  });
};

export const saveEdge = async (params: {
  playgroundId: string;
  data: ConnProps;
}) => {
  await db.insert(playgroundEdge).values({
    playgroundId: params.playgroundId,
    source: params.data.source,
    sourceOutput: params.data.sourceOutput,
    target: params.data.target,
    targetInput: params.data.targetInput,
  });
};

export const deleteEdge = async (params: {
  playgroundId: string;
  data: ConnProps;
}) => {
  await db
    .delete(playgroundEdge)
    .where(
      and(
        eq(playgroundEdge.playgroundId, params.playgroundId),
        eq(playgroundEdge.source, params.data.source),
        eq(playgroundEdge.sourceOutput, params.data.sourceOutput),
        eq(playgroundEdge.target, params.data.target),
        eq(playgroundEdge.targetInput, params.data.targetInput)
      )
    );
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
    return nodes[0];
  });
};

export const getDataSets = async (projectId: string) => {
  return await db.query.dataSet.findMany({
    where: (dataSet, { eq }) => eq(dataSet.project_id, projectId),
  });
};

export const getDataSet = async (dataSetId: string) => {
  try {
    return await db.query.dataSet.findFirst({
      where: (dataSet, { eq }) => eq(dataSet.id, dataSetId),
      with: {
        rows: true,
      },
    });
  } catch (err) {
    console.log("err", err);
  }
};

export const insertDataSet = async (params: { id: string; data: any }) => {
  return await db.transaction(async (tx) => {
    const row = tx
      .insert(dataRow)
      .values({
        data_set_id: params.id,
        data: params.data,
      })
      .returning();

    return row;
  });
};

export const deleteDataRow = async (params: { id: string }) => {
  return await db.delete(dataRow).where(eq(dataRow.id, params.id));
};

export const getDatasetPaginated = async (params: {
  datasetId: string;
  cursor?: string;
  limit?: number;
}) => {
  const cursorCondition = params.cursor
    ? gt(dataRow.id, params.cursor)
    : undefined;
  console.log("cursorCondition", cursorCondition);
  const data = await db
    .select()
    .from(dataRow)
    .where(and(eq(dataRow.data_set_id, params.datasetId), cursorCondition))
    .orderBy(dataRow.id)
    .limit(params?.limit || 10);

  return {
    data,
    nextCursor: data[data.length - 1]?.id,
  };
};

export const getNodeData = async (nodeId: string) => {
  console.log("getNodeData", { nodeId });

  return await db.query.nodeData.findFirst({
    where: (nodeData, { eq }) => eq(nodeData.id, nodeId),
  });
};

export const setNodeData = action(
  z.object({
    nodeId: z.string(),
    state: z.string().transform((val) => JSON.parse(val)),
  }),
  async (params) => {
    // console.log("setNodeData", {
    //   nodeId: params.nodeId,
    //   state: params.state.value,
    //   context: params.state.context,
    // });

    return await db
      .update(nodeData)
      .set({ state: params.state })
      .where(eq(nodeData.id, params.nodeId))
      .returning();
  }
);
