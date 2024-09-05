import { get } from "lodash-es";
import { z } from "zod";

import { and, eq, or, schema, sql } from "@craftgen/db/db";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const craftNodeRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        workflowVersionId: z.string(),
        projectId: z.string(),
        data: z.object({
          id: z.string(),
          contextId: z.string(),
          context: z.string().transform((val) => JSON.parse(val)),
          type: z.string(),
          width: z.number(),
          height: z.number(),
          color: z.string(),
          label: z.string(),
          position: z.object({
            x: z.number(),
            y: z.number(),
          }),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("saveNode", input);
      await ctx.db.transaction(async (tx) => {
        const [contextOfTheNode] = await tx
          .select()
          .from(schema.context)
          .where(eq(schema.context.id, input.data.contextId))
          .limit(1);
        // /// This is happens when user deletes the node and then tries to undo it.
        if (!contextOfTheNode) {
          // reincarnate the context
          await tx
            .insert(schema.context)
            .values({
              id: input.data.contextId,
              project_id: input.projectId,
              type: input.data.type,
              workflow_id: input.workflowId,
              workflow_version_id: input.workflowVersionId,
              state: input.data.context,
            })
            .onConflictDoNothing();
        }

        await tx
          .insert(schema.workflowNode)
          .values({
            id: input.data.id,
            workflowId: input.workflowId,
            workflowVersionId: input.workflowVersionId,
            projectId: input.projectId,
            contextId: input.data.contextId,
            type: input.data.type,
            width: input.data.width,
            height: input.data.height,
            color: input.data.color,
            label: input.data.label,
            position: input.data.position,
          })
          .onConflictDoUpdate({
            target: schema.workflowNode.id,
            set: {
              type: input.data.type,
              width: input.data.width,
              height: input.data.height,
              color: input.data.color,
              label: input.data.label,
              position: input.data.position,
            },
          });
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        workflowVersionId: z.string(),
        data: z.object({
          id: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("deleteNode", input);
      await ctx.db.transaction(async (tx) => {
        // TODO check this. Delete context if it's not attached to any published version.
        const [version] = await tx
          .select({
            publishedAt: schema.workflowVersion.publishedAt,
          })
          .from(schema.workflowVersion)
          .where(eq(schema.workflowVersion.id, input.workflowVersionId))
          .limit(1);
        if (!version) {
          throw new Error("Workflow version not found");
        }
        console.log("version", version);
        if (!version.publishedAt) {
          // delete all the execution data as well.
          console.log("deleting node execution data");
          await tx
            .delete(schema.workflowExecution)
            .where(
              and(
                eq(schema.workflowExecution.workflowId, input.workflowId),
                eq(
                  schema.workflowExecution.workflowVersionId,
                  input.workflowVersionId,
                ),
                or(
                  eq(schema.workflowExecution.entryContextId, input.data.id),
                  eq(schema.workflowExecution.currentContextId, input.data.id),
                ),
              ),
            );
          // await tx
          //   .delete(schema.nodeExecutionData)
          //   .where(
          //     and(
          //       eq(schema.nodeExecutionData.workflowId, input.workflowId),
          //       eq(
          //         schema.nodeExecutionData.workflowVersionId,
          //         input.workflowVersionId,
          //       ),
          //       eq(schema.nodeExecutionData.workflowNodeId, input.data.id),
          //     ),
          //   );
        }
        const [node] = await tx
          .delete(schema.workflowNode)
          .where(
            and(
              eq(schema.workflowNode.workflowId, input.workflowId),
              eq(
                schema.workflowNode.workflowVersionId,
                input.workflowVersionId,
              ),
              eq(schema.workflowNode.id, input.data.id),
            ),
          )
          .returning();
        if (!node) {
          throw new Error("Node not found");
        }

        await tx
          .delete(schema.context)
          .where(and(eq(schema.context.id, node.contextId)));
        // const contextsToDelete: string[] = [node.contextId];
        // console.log("DELETE CONTEXT", contextsToDelete);
        // async function deleteRecursive(targetContextId: string) {
        //   let contextRelations = await tx
        //     .select()
        //     .from(schema.contextRelation)
        //     .where(
        //       and(
        //         eq(schema.contextRelation.source, targetContextId),
        //         eq(schema.contextRelation.type, "parent"),
        //       ),
        //     );

        //   contextsToDelete.push(...contextRelations.map((c) => c.target));
        //   console.log("DELETE CONTEXT", contextsToDelete);

        //   for (const contextRelation of contextRelations) {
        //     await deleteRecursive(contextRelation.target);
        //   }
        // }
        // await deleteRecursive(node.contextId);
        // console.log("DELETING", contextsToDelete);
        // await tx
        //   .delete(schema.context)
        //   .where(inArray(schema.context.id, contextsToDelete));
      });
    }),
  getContext: protectedProcedure
    .input(
      z.object({
        contextId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [context] = await ctx.db
        .select()
        .from(schema.context)
        .where(eq(schema.context.id, input.contextId))
        .limit(1);
      return context;
    }),
  setContext: protectedProcedure
    .input(
      z.array(
        z.object({
          contextId: z.string(),
          projectId: z.string(),
          workflowId: z.string(),
          workflowVersionId: z.string(),
          context: z.string().transform((val) => JSON.parse(val)),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const newContext = await tx
          .insert(schema.context)
          .values(
            input.map((i) => ({
              id: i.contextId,
              project_id: i.projectId,
              type: i.context.src, // src
              state: i.context.snapshot,
              workflow_id: i.workflowId,
              workflow_version_id: i.workflowVersionId,
              parent_id: get(i.context, "snapshot.context.parent.id"),
            })),
          )
          .onConflictDoUpdate({
            target: schema.context.id,
            set: {
              state: sql`excluded.state`,
              parent_id: sql`excluded.parent_id`,
            },
          })
          .returning();

        return newContext;
      });
    }),
  updateMetadata: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        position: z
          .object({
            x: z.number(),
            y: z.number(),
          })
          .optional(),
        size: z.object({ width: z.number(), height: z.number() }).optional(),
        label: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(schema.workflowNode)
        .set({
          ...(input.size && input.size),
          ...(input.position && { position: input.position }),
          ...(input.label && { label: input.label }),
        })
        .where(eq(schema.workflowNode.id, input.id));
    }),
});
