"use server";

import { action } from "@/lib/safe-action";
import { db } from "@seocraft/supabase/db";
import { z } from "zod";

export const getLogs = action(
  z.object({ worfklowId: z.string(), workflowVersionId: z.string() }),
  async (params) => {
    console.log("params", params);
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
        },
      },
    });
    console.log("111", a);

    return a;
  }
);
