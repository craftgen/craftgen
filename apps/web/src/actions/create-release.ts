"use server";

import { action } from "@/lib/safe-action";
import {
  db,
  workflowVersion,
  workflow,
  desc,
  context,
  workflowNode,
  workflowEdge,
  eq,
  and,
} from "@seocraft/supabase/db";
import { isEqual } from "lodash-es";
import { z } from "zod";

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
        .leftJoin(workflow, eq(workflow.id, workflowVersion.workflowId))
        .orderBy(desc(workflowVersion.version))
        .limit(1);
      if (!projectId) {
        throw new Error("Project not found");
      }
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
