"use server";

import { WORKFLOW_TRIGGER } from "@/jobs/workflow-trigger";
import { action } from "@/lib/safe-action";
import {
  db,
  workflowExecution,
  nodeExecutionData,
} from "@seocraft/supabase/db";
import { z } from "zod";

export const createExecution = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    input: z.object({
      id: z.string(),
      values: z.any(),
    }),
    headless: z.boolean().optional().default(false),
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
          project: {
            columns: {
              slug: true,
            },
          },
          workflow: {
            columns: {
              slug: true,
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
        return {
          contextId: node.contextId,
          workflowExecutionId: execution.id,
          projectId: workflowVersion.projectId,
          workflowId: params.workflowId,
          workflowVersionId: params.workflowVersionId,
          workflowNodeId: node.id,
          state: null,
          type: node.type,
        };
      });
      await tx.insert(nodeExecutionData).values(nodeExecutionDataSnap);

      if (params.headless) {
        await WORKFLOW_TRIGGER.send({
          projectSlug: workflowVersion.project.slug,
          workflowSlug: workflowVersion.workflow.slug,
          version: workflowVersion.version,
          executionId: execution.id,
          workflowNodeId: params.input.id,
          values: params.input.values,
        });
      }
      return execution;
    });
  }
);
