"use server";

import { action } from "@/lib/safe-action";
import { db, workflowExecution, eq } from "@seocraft/supabase/db";
import { z } from "zod";

export const deleteExecution = action(
  z.object({ executionId: z.string() }),
  async (params) => {
    return await db
      .delete(workflowExecution)
      .where(eq(workflowExecution.id, params.executionId))
      .returning();
  }
);
