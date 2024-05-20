import { z } from "zod";

import { eq, schema } from "@seocraft/supabase/db";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const craftExecutionRouter = createTRPCRouter({
  setState: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.string(),
        workflowId: z.string(),
        workflowVersionId: z.string(),
        contextId: z.string(),
        workflowExecutionId: z.string(),
        projectId: z.string(),
        state: z.string().transform((val) => JSON.parse(val)),
        complete: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [executionNodeState] = await tx
          .insert(schema.nodeExecutionData)
          .values({
            id: input.id,
            contextId: input.contextId,
            workflowExecutionId: input.workflowExecutionId,
            projectId: input.projectId,
            workflowId: input.workflowId,
            workflowVersionId: input.workflowVersionId,
            type: input.type,
            state: input.state as any,
            ...(input.complete && { completedAt: new Date() }),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.nodeExecutionData.id,
            set: {
              state: input.state as any,
              updatedAt: new Date(),
              ...(input.complete && { completedAt: new Date() }),
            },
          })
          .returning();
        if (!executionNodeState) {
          throw new Error("Failed to update node execution state");
        }
        await tx
          .update(schema.workflowExecution)
          .set({
            updatedAt: new Date(),
          })
          .where(
            eq(
              schema.workflowExecution.id,
              executionNodeState.workflowExecutionId,
            ),
          );
        return executionNodeState;
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        state: z.string().transform((val) => JSON.parse(val)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(schema.workflowExecution)
        .set({
          state: input.state,
          updatedAt: new Date(),
        })
        .where(eq(schema.workflowExecution.id, input.id))

        .returning();
    }),
  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        workflowVersionId: z.string(),
        contextId: z.string(),
        input: z.object({
          id: z.string(),
          values: z.any(),
        }),
        headless: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const context = await tx.query.context.findFirst({
          where: (context, { eq }) => eq(context.id, input.contextId),
        });
        const [execution] = await tx
          .insert(schema.workflowExecution)
          .values({
            workflowId: input.workflowId,
            workflowVersionId: input.workflowVersionId,
            entryContextId: input.input.id,
            state: context?.state,
          })
          .returning();
        if (!execution) {
          throw new Error("Failed to create execution");
        }
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

  list: protectedProcedure
    .input(z.object({ worfklowId: z.string(), workflowVersionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const a = await ctx.db.query.workflowVersion.findFirst({
        where: (workflowVersion, { eq }) =>
          eq(workflowVersion.id, input.workflowVersionId),
        with: {
          workflow: {
            with: {
              project: {
                columns: {
                  slug: true,
                },
              },
            },
            columns: {
              slug: true,
            },
          },
          executions: {
            with: {
              steps: true,
              executionData: {
                orderBy: (exec, { desc }) => [desc(exec.updatedAt)],
              },
            },
            orderBy: (exec, { desc }) => [desc(exec.updatedAt)],
          },
        },
      });
      if (!a) {
        throw new Error("Workflow not found 5");
      }
      return {
        ...a,
        executions: a?.executions.map((execution) => {
          return {
            url: `/${a.workflow.project.slug}/${a.workflow.slug}/v/${a.version}?execution=${execution.id}`,
            ...execution,
          };
        }),
      };
    }),
});
