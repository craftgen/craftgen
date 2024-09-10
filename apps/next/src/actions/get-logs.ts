"use server";

import { z } from "zod";

import { db } from "@craftgen/db/db";

import { action } from "@/lib/safe-action";

export const getLogs = action(
  z.object({ worfklowId: z.string(), workflowVersionId: z.string() }),
  async (input) => {
    const a = await db.query.workflowVersion.findFirst({
      where: (workflowVersion, { eq }) =>
        eq(workflowVersion.id, input.workflowVersionId),
      with: {
        workflow: {
          with: {
            project: {
              columns: {
                slug: true,
              },
            },
          },
          columns: {
            slug: true,
          },
        },
        executions: {
          with: {
            steps: true,
            executionData: {
              orderBy: (exec, { desc }) => [desc(exec.updatedAt)],
            },
          },
          orderBy: (exec, { desc }) => [desc(exec.updatedAt)],
        },
      },
    });
    if (!a) {
      throw new Error("Workflow not found 5");
    }
    return {
      ...a,
      executions: a?.executions.map((execution) => {
        return {
          url: `/${a.workflow.project.slug}/${a.workflow.slug}/v/${a.version}?execution=${execution.id}`,
          ...execution,
        };
      }),
    };
  },
);
