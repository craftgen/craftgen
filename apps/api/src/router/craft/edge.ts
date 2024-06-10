import { z } from "zod";

import { and, eq, schema } from "@craftgen/db/db";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

type ConnProps = {
  source: string;
  target: string;
  sourceOutput: string;
  targetInput: string;
};

export const craftEdgeRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        workflowVersionId: z.string(),
        data: z.custom<ConnProps>(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(schema.workflowEdge).values({
        workflowId: input.workflowId,
        workflowVersionId: input.workflowVersionId,
        source: input.data.source,
        sourceOutput: input.data.sourceOutput,
        target: input.data.target,
        targetInput: input.data.targetInput,
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        workflowVersionId: z.string(),
        data: z.custom<ConnProps>(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(schema.workflowEdge)
        .where(
          and(
            eq(schema.workflowEdge.workflowId, input.workflowId),
            eq(schema.workflowEdge.workflowVersionId, input.workflowVersionId),
            eq(schema.workflowEdge.source, input.data.source),
            eq(schema.workflowEdge.sourceOutput, input.data.sourceOutput),
            eq(schema.workflowEdge.target, input.data.target),
            eq(schema.workflowEdge.targetInput, input.data.targetInput),
          ),
        );
    }),
});
