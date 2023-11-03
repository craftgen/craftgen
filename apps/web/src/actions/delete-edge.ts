"use server";

import { z } from "zod";

import { and, db, eq, workflowEdge } from "@seocraft/supabase/db";

import { ConnProps } from "@/core/types"; // TODO: core-type
import { action } from "@/lib/safe-action";

export const deleteEdge = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    data: z.custom<ConnProps>(),
  }),
  async (input) => {
    await db
      .delete(workflowEdge)
      .where(
        and(
          eq(workflowEdge.workflowId, input.workflowId),
          eq(workflowEdge.workflowVersionId, input.workflowVersionId),
          eq(workflowEdge.source, input.data.source),
          eq(workflowEdge.sourceOutput, input.data.sourceOutput),
          eq(workflowEdge.target, input.data.target),
          eq(workflowEdge.targetInput, input.data.targetInput),
        ),
      );
  },
);
