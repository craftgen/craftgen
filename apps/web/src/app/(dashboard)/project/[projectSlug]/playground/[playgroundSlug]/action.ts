"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import {
  db,
  eq,
  context,
  workflowNode,
  workflow,
  and,
  projectMembers,
  workflowEdge,
  workflowExecution,
  desc,
  sql,
  workflowVersion,
  workflowExecutionStep,
  nodeExecutionData,
} from "@seocraft/supabase/db";
import { cookies } from "next/headers";
import { ConnProps, NodeTypes, Position, nodesMeta } from "./playground/types";
import * as FlexLayout from "flexlayout-react";
import { action } from "@/lib/safe-action";
import { z } from "zod";
import { isEqual } from "lodash-es";

export const getWorkflowById = async (workflowId: string) => {
  return await db.query.workflow.findFirst({
    where: (workflow, { eq }) => eq(workflow.id, workflowId),
    with: {
      nodes: {
        with: {
          context: {
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
      return await tx.query.workflow.findFirst({
        where: (workflow, { eq, and }) =>
          and(
            eq(workflow.slug, params.workflowSlug),
            eq(workflow.projectSlug, params.projectSlug)
          ),
        columns: {
          id: true,
          slug: true,
          projectSlug: true,
        },
        with: {
          versions: {
            where: (workflowVersion, { eq, and, isNotNull }) =>
              and(isNotNull(workflowVersion.publishedAt)),
            orderBy: (workflowVersion, { desc }) => [
              desc(workflowVersion.version),
            ],
          },
        },
      });
    });
  }
);

export const getWorkflow = action(
  z.object({
    workflowSlug: z.string(),
    projectSlug: z.string(),
    version: z.number().optional(),
    published: z.boolean().optional().default(true),
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
          ),
        with: {
          project: true,
          versions: {
            where: (workflowVersion, { and, eq, isNotNull }) =>
              and(
                params.version
                  ? eq(workflowVersion.version, params.version)
                  : sql`true`,
                params.published
                  ? isNotNull(workflowVersion.publishedAt)
                  : sql`true`
              ),
            orderBy: (workflowVersion, { desc }) => [
              desc(workflowVersion.version),
            ],
            limit: 1,
            with: {
              edges: true,
              nodes: {
                with: {
                  context: {
                    columns: {
                      state: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!workflow) {
        throw new Error("Playground not found");
      }

      return {
        ...workflow,
        currentVersion:
          workflow.versions.length > 0 ? workflow.versions[0].version : 0,
        version: workflow.versions[0],
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
    projectId: z.string(),
    data: z.object({
      id: z.string(),
      contextId: z.string(),
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
      await tx
        .insert(workflowNode)
        .values({
          id: params.data.id,
          workflowId: params.workflowId,
          workflowVersionId: params.workflowVersionId,
          projectId: params.projectId,
          contextId: params.data.contextId,
          type: params.data.type,
          width: params.data.width,
          height: params.data.height,
          color: params.data.color,
          label: params.data.label,
          position: params.data.position,
        })
        .onConflictDoUpdate({
          target: workflowNode.id,
          set: {
            contextId: params.data.contextId,
            type: params.data.type,
            width: params.data.width,
            height: params.data.height,
            color: params.data.color,
            label: params.data.label,
            position: params.data.position,
          },
        });
    });
  }
);

export const deleteNode = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    data: z.object({
      id: z.string(),
    }),
  }),
  async (params) => {
    console.log("deleteNode", params);
    await db.transaction(async (tx) => {
      const [node] = await tx
        .delete(workflowNode)
        .where(
          and(
            eq(workflowNode.workflowId, params.workflowId),
            eq(workflowNode.workflowVersionId, params.workflowVersionId),
            eq(workflowNode.id, params.data.id)
          )
        )
        .returning();
      // TODO check this. Delete context if it's not attached to any published version.
      await tx.delete(context).where(eq(context.id, node.contextId));
    });
  }
);

export const saveEdge = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    data: z.custom<ConnProps>(),
  }),
  async (params) => {
    await db.insert(workflowEdge).values({
      workflowId: params.workflowId,
      workflowVersionId: params.workflowVersionId,
      source: params.data.source,
      sourceOutput: params.data.sourceOutput,
      target: params.data.target,
      targetInput: params.data.targetInput,
    });
  }
);

export const deleteEdge = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    data: z.custom<ConnProps>(),
  }),
  async (params) => {
    await db
      .delete(workflowEdge)
      .where(
        and(
          eq(workflowEdge.workflowId, params.workflowId),
          eq(workflowEdge.workflowVersionId, params.workflowVersionId),
          eq(workflowEdge.source, params.data.source),
          eq(workflowEdge.sourceOutput, params.data.sourceOutput),
          eq(workflowEdge.target, params.data.target),
          eq(workflowEdge.targetInput, params.data.targetInput)
        )
      );
  }
);

export const createNodeInDB = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    projectSlug: z.string(),
    type: z.custom<NodeTypes>(),
    state: z.any().optional(),
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
          ...(params.state && { state: params.state }),
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

export const getContext = action(
  z.object({ contextId: z.string() }),
  async ({ contextId }) => {
    console.log("getContext", { contextId });

    return await db.query.context.findFirst({
      where: (context, { eq }) => eq(context.id, contextId),
    });
  }
);

export const setContext = action(
  z.object({
    contextId: z.string(),
    state: z.string().transform((val) => JSON.parse(val)),
  }),
  async (params) => {
    return await db
      .update(context)
      .set({ state: params.state as any })
      .where(eq(context.id, params.contextId))
      .returning();
  }
);

export const unreleasedChanges = action(z.object({}), async () => {
  return await db.query.workflow.findMany({
    where: (workflow, { isNull }) => isNull(workflow.publishedAt),
  });
});

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
      const [{ latestVersionId, latestVersion, projectId }] = await tx
        .select({
          latestVersionId: workflowVersion.id,
          latestVersion: workflowVersion.version,
          projectId: workflow.projectId,
        })
        .from(workflowVersion)
        .where(and(eq(workflowVersion.workflowId, params.workflowId)))
        .orderBy(desc(workflowVersion.version))
        .limit(1);

      // Publish the latest version
      await tx
        .update(workflowVersion)
        .set({ publishedAt: new Date(), changeLog: params.changeLog })
        .where(
          and(
            eq(workflowVersion.workflowId, params.workflowId),
            eq(workflowVersion.version, latestVersion)
          )
        );

      const newVersion = await tx
        .insert(workflowVersion)
        .values({
          workflowId: params.workflowId,
          version: latestVersion + 1,
          previousVersionId: latestVersionId,
          projectId,
        })
        .returning();

      // Copy nodes
      const previousWorkflowVersionWithGraph =
        await tx.query.workflowVersion.findFirst({
          where: (workflowVersion, { eq }) =>
            eq(workflowVersion.id, latestVersionId),
          with: {
            nodes: {
              with: {
                context: {
                  with: {
                    previousContext: true,
                  },
                },
              },
            },
            edges: true,
          },
        });
      if (!previousWorkflowVersionWithGraph) {
        throw new Error("Could not find workflow version");
      }

      const edges = previousWorkflowVersionWithGraph.edges;

      console.log("COPYING NODES", previousWorkflowVersionWithGraph.nodes);
      // copy over nodes;
      await Promise.all(
        previousWorkflowVersionWithGraph.nodes.map(async ({ id, ...node }) => {
          const { context: contextState, ...workflowNodeMeta } = node;
          let contextId;
          const previousContextState = contextState.previousContext?.state;
          if (isEqual(previousContextState, contextState.state)) {
            console.log("REUSING CONTEXT");
            contextId = contextState.previousContext?.id;
          } else {
            console.log("CREATING NEW CONTEXT");
            const [cloneContext] = await tx
              .insert(context)
              .values({
                type: contextState.type,
                project_id: contextState.project_id,
                previousContextId: contextState.id,
                state: contextState.state,
              })
              .returning();
            contextId = cloneContext.id;
          }
          if (!contextId) {
            throw new Error("Could not find or create context");
          }

          const [cloneNode] = await tx
            .insert(workflowNode)
            .values({
              ...workflowNodeMeta,
              contextId,
              workflowVersionId: newVersion[0].id,
            })
            .returning();
          edges.forEach(async (edge) => {
            if (edge.source === id) {
              edge.source = cloneNode.id;
            }
            if (edge.target === id) {
              edge.target = cloneNode.id;
            }
          });
        })
      );

      console.log("COPYING EDGES", edges);
      if (edges.length > 0) {
        await tx.insert(workflowEdge).values(
          edges.map((edge) => ({
            ...edge,
            workflowVersionId: newVersion[0].id,
          }))
        );
      }

      return newVersion[0];
    });
  }
);

export const createExecution = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    input: z
      .object({
        id: z.string(),
        values: z.any(),
      })
      .optional(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      const workflowVersion = await tx.query.workflowVersion.findFirst({
        where: (workflowVersion, { eq }) =>
          eq(workflowVersion.id, params.workflowVersionId),
        with: {
          nodes: {
            with: {
              context: true,
            },
          },
        },
      });
      if (!workflowVersion) {
        throw new Error("Workflow version not found");
      }
      const [execution] = await tx
        .insert(workflowExecution)
        .values({
          workflowId: params.workflowId,
          workflowVersionId: params.workflowVersionId,
        })
        .returning();
      const nodeExecutionDataSnap = workflowVersion.nodes.map((node) => {
        let state = node.context.state!;
        if (params.input && node.id === params.input.id) {
          state = {
            ...state,
            context: {
              ...state.context,
              inputs: params.input.values,
              outputs: params.input.values,
            },
          };
          console.log("ADDED THE INPUTS", state);
        }
        return {
          contextId: node.contextId,
          workflowExecutionId: execution.id,
          projectId: workflowVersion.projectId,
          workflowId: params.workflowId,
          state,
          type: node.context.type,
          workflowNodeId: node.id,
          workflowVersionId: params.workflowVersionId,
        };
      });

      const nodeexecutions = await tx
        .insert(nodeExecutionData)
        .values(nodeExecutionDataSnap)
        .returning();
      console.log("nodeexecutions", nodeexecutions);
      return execution;
    });
  }
);

export const getExecutionNode = action(
  z.object({
    contextId: z.string(),
    workflowId: z.string(),
    workflowNodeId: z.string(),
    workflowExecutionId: z.string(),
    workflowVersionId: z.string(),
    projectId: z.string(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      const [executionNodeState] = await tx
        .select()
        .from(nodeExecutionData)
        .where(
          and(
            eq(nodeExecutionData.contextId, params.contextId),
            eq(
              nodeExecutionData.workflowExecutionId,
              params.workflowExecutionId
            )
          )
        );
      return executionNodeState;
    });
  }
);

export const updateExecutionNode = action(
  z.object({
    id: z.string(),
    state: z.string().transform((val) => JSON.parse(val)),
    complete: z.boolean().optional(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      const [executionNodeState] = await tx
        .update(nodeExecutionData)
        .set({
          state: params.state as any,
          ...(params.complete && { completedAt: new Date() }),
          updatedAt: new Date(),
        })
        .where(eq(nodeExecutionData.id, params.id))
        .returning();
      await tx
        .update(workflowExecution)
        .set({
          updatedAt: new Date(),
        })
        .where(
          eq(workflowExecution.id, executionNodeState.workflowExecutionId)
        );
      return executionNodeState;
    });
  }
);

export const createExecutionStep = action(
  z.object({
    source_node_execution_data_id: z.string(),
    workflowExecutionId: z.string(),
    target_node_execution_data_id: z.string(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      const execution = await tx
        .insert(workflowExecutionStep)
        .values({
          ...params,
        })
        .returning();
      return execution[0];
    });
  }
);
