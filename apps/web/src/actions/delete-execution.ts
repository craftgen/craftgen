"use server";

import { action } from "@/lib/safe-action";
import { db, workflowExecution, eq } from "@seocraft/supabase/db";
import { z } from "zod";

export const deleteExecution = action(
  z.object({ executionId: z.string() }),
  async (input) => {
    return await db
      .delete(workflowExecution)
      .where(eq(workflowExecution.id, input.executionId))
      .returning();
  }
);
