"use server";

import { ConnProps } from "@/core/types"; // TODO: core-type
import { action } from "@/lib/safe-action";
import { db, workflowEdge, eq, and } from "@seocraft/supabase/db";
import { z } from "zod";

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
