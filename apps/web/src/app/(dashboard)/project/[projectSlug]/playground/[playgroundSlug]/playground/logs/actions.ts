"use server";

import { action } from "@/lib/safe-action";
import { db, eq, workflowExecution } from "@seocraft/supabase/db";
import { z } from "zod";

export const getLogs = action(
  z.object({ worfklowId: z.string(), workflowVersionId: z.string() }),
  async (params) => {
    const a = await db.query.workflowVersion.findFirst({
      where: (workflowVersion, { eq }) =>
        eq(workflowVersion.id, params.workflowVersionId),
      with: {
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

    return a;
  }
);

export const deleteExecution = action(
  z.object({ executionId: z.string() }),
  async (params) => {
    return await db
      .delete(workflowExecution)
      .where(eq(workflowExecution.id, params.executionId))
      .returning();
  }
);
