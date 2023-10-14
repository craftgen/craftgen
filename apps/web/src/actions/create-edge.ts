'use server';

import { ConnProps } from "@/core/types";
import { action } from "@/lib/safe-action";
import { db, workflowEdge } from "@seocraft/supabase/db";
import { z } from "zod";

export const saveEdge = action(
  z.object({
    workflowId: z.string(),
    workflowVersionId: z.string(),
    data: z.custom<ConnProps>(),
  }),
  async (params) => {
    await db.insert(workflowEdge).values({
      workflowId: params.workflowId,
      workflowVersionId: params.workflowVersionId,
      source: params.data.source,
      sourceOutput: params.data.sourceOutput,
      target: params.data.target,
      targetInput: params.data.targetInput,
    });
  }
);
