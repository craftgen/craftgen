"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import {
  db,
  eq,
  nodeData,
  workflowNode,
  workflow,
  and,
  dataRow,
  gt,
  projectMembers,
  workflowEdge,
  workflowExecution,
  desc,
  sql,
  not,
  workflowVersion,
} from "@seocraft/supabase/db";
import { cookies } from "next/headers";
import { ConnProps, NodeTypes, Position } from "./playground/types";
import * as FlexLayout from "flexlayout-react";
import { action } from "@/lib/safe-action";
import { z } from "zod";

export const getWorkflowById = async (workflowId: string) => {
  return await db.query.workflow.findFirst({
    where: (workflow, { eq }) => eq(workflow.id, workflowId),
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

export const getWorkflowVersions = action(
  z.object({
    projectSlug: z.string(),
    workflowSlug: z.string(),
  }),
  async (params) => {
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
      return await tx.query.workflow.findMany({
        where: (workflow, { eq, and }) =>
          and(
            eq(workflow.projectId, project?.id)
            // TODO:
            // not(eq(workflow.version, 0)) // This is a hack to not show the latest version.
          ),
        // orderBy: (playground, { desc }) => [desc(playground.version)],
      });
    });
  }
);

export const getWorkflow = action(
  z.object({
    workflowSlug: z.string(),
    projectSlug: z.string(),
    version: z.number().optional(),
  }),
  async (params) => {
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
      const workflow = await tx.query.workflow.findFirst({
        where: (workflow, { eq, and }) =>
          and(
            eq(workflow.slug, params.workflowSlug),
            eq(workflow.projectId, project.id)
            // TODO:
            // params.version ? eq(workflow.version, params.version) : sql`true`
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
        // TODO:
        // orderBy: (playground, { desc }) => [desc(playground.version)],
      });
      if (!workflow) {
        throw new Error("Playground not found");
      }
      return {
        ...workflow,
        readonly,
      };
    });
  }
);

export const getPlaygroundInputsOutputs = async (params: {
  playgroundId: string;
}) => {
  return await db.transaction(async (tx) => {
    tx.select()
      .from(workflowNode)
      .where(
        and(
          eq(workflowNode.workflowId, params.playgroundId),
          eq(workflowNode.type, "Input")
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
    .update(workflow)
    .set(args)
    .where(eq(workflow.id, playgroundId))
    .returning();
};

export const savePlaygroundLayout = async (params: {
  playgroundId: string;
  layout: FlexLayout.IJsonModel;
}) => {
  console.log("saving playground layout", params);
  return await db
    .update(workflow)
    .set({ layout: params.layout })
    .where(eq(workflow.id, params.playgroundId))
    .returning();
};

export const updateNodeMeta = async (params: {
  id: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}): Promise<void> => {
  console.log("nodeMeta", params);
  await db
    .update(workflowNode)
    .set({
      ...(params.size && params.size),
      ...(params.position && { position: params.position }),
    })
    .where(eq(workflowNode.id, params.id));
};

export const saveNode = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    data: z.object({
      id: z.string(),
      type: z.custom<NodeTypes>(),
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
      await tx.insert(workflowNode).values({
        id: params.data.id,
        workflowId: params.workflowId,
        workflowVersionId: params.workflowVersionId,
        type: params.data.type,
        width: params.data.width,
        height: params.data.height,
        color: params.data.color,
        label: params.data.label,
        position: params.data.position,
      });
    });
  }
);

export const deleteNode = async (params: {
  playgroundId: string;
  data: {
    id: string;
  };
}) => {
  console.log("deleteNode", params);
  await db.transaction(async (tx) => {
    await tx
      .delete(workflowNode)
      .where(
        and(
          eq(workflowNode.workflowId, params.playgroundId),
          eq(workflowNode.id, params.data.id)
        )
      );
    await tx.delete(nodeData).where(eq(nodeData.id, params.data.id)); // TODO check this.
  });
};

export const saveEdge = action(
  z.object({
    workflowId: z.string(),
    data: z.custom<ConnProps>(),
  }),
  async (params) => {
    await db.insert(workflowEdge).values({
      workflowId: params.workflowId,
      source: params.data.source,
      sourceOutput: params.data.sourceOutput,
      target: params.data.target,
      targetInput: params.data.targetInput,
    });
  }
);

export const deleteEdge = async (params: {
  playgroundId: string;
  data: ConnProps;
}) => {
  await db
    .delete(workflowEdge)
    .where(
      and(
        eq(workflowEdge.workflowId, params.playgroundId),
        eq(workflowEdge.source, params.data.source),
        eq(workflowEdge.sourceOutput, params.data.sourceOutput),
        eq(workflowEdge.target, params.data.target),
        eq(workflowEdge.targetInput, params.data.targetInput)
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
/**
 * Creating realease basically clonening the current state of the playground.
 * This is used to create a new version of the playground.
 */
export const createRelease = action(
  z.object({
    workflowId: z.string(),
    changeLog: z.string(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(workflow)
        .where(and(eq(workflow.id, params.workflowId)))
        .limit(1);

      const [{ latestVersion }] = await tx
        .select({
          latestVersion: workflowVersion.version,
        })
        .from(workflowVersion)
        .where(and(eq(workflowVersion.workflowId, params.workflowId)))
        .orderBy(desc(workflowVersion.version))
        .limit(1);

      const newVersion = await tx
        .insert(workflowVersion)
        .values({
          workflowId: params.workflowId,
          publishedAt: new Date(),
          version: latestVersion + 1,
          changeLog: params.changeLog,
        })
        .returning();

      return newVersion[0];
    });
  }
);

export const createExecution = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      const execution = await tx
        .insert(workflowExecution)
        .values({
          workflowId: params.workflowId,
          workflowVersionId: params.workflowVersionId,
        })
        .returning();
      return execution[0];
    });
  }
);
