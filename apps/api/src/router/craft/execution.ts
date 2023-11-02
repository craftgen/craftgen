import { eq, schema } from "@seocraft/supabase/db";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const craftExecutionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        workflowVersionId: z.string(),
        input: z.object({
          id: z.string(),
          values: z.any(),
        }),
        headless: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [execution] = await tx
          .insert(schema.workflowExecution)
          .values({
            workflowId: input.workflowId,
            workflowVersionId: input.workflowVersionId,
            entryWorkflowNodeId: input.input.id,
          })
          .returning();
        return execution;
      });
    }),
  delete: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(schema.workflowExecution)
        .where(eq(schema.workflowExecution.id, input.executionId))
        .returning();
    }),
});
