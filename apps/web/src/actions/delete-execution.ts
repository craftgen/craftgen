"use server";

import { z } from "zod";

import { db, eq, workflowExecution } from "@seocraft/supabase/db";

import { action } from "@/lib/safe-action";

export const deleteExecution = action(
  z.object({ executionId: z.string() }),
  async (input) => {
    return await db
      .delete(workflowExecution)
      .where(eq(workflowExecution.id, input.executionId))
      .returning();
  },
);
