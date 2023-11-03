"use server";

import { z } from "zod";

import { db, workflowEdge } from "@seocraft/supabase/db";

import { ConnProps } from "@/core/types";
import { action } from "@/lib/safe-action";

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
  },
);
