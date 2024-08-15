import { z } from "zod";

import { and, eq, tenant } from "@craftgen/database";

import { createTRPCRouter, protectedProcedure } from "../../trpc.ts";

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
      await ctx.db.insert(tenant.workflowEdge).values({
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
        .delete(tenant.workflowEdge)
        .where(
          and(
            eq(tenant.workflowEdge.workflowId, input.workflowId),
            eq(tenant.workflowEdge.workflowVersionId, input.workflowVersionId),
            eq(tenant.workflowEdge.source, input.data.source),
            eq(tenant.workflowEdge.sourceOutput, input.data.sourceOutput),
            eq(tenant.workflowEdge.target, input.data.target),
            eq(tenant.workflowEdge.targetInput, input.data.targetInput),
          ),
        );
    }),
});
