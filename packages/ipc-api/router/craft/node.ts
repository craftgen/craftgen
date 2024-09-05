import { get } from "lodash-es";
import { z } from "zod";

import { and, eq, sql, tenant } from "@craftgen/database";

import { createTRPCRouter, protectedProcedure } from "../../trpc.ts";

export const craftNodeRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        workflowVersionId: z.string(),
        organizationId: z.string(),
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
          .from(tenant.context)
          .where(eq(tenant.context.id, input.data.contextId))
          .limit(1);
        // /// This is happens when user deletes the node and then tries to undo it.
        if (!contextOfTheNode) {
          // reincarnate the context
          await tx
            .insert(tenant.context)
            .values({
              id: input.data.contextId,
              organizationId: input.organizationId,
              type: input.data.type,
              workflowId: input.workflowId,
              snapshot: input.data.context,
              workflowVersionId: input.workflowVersionId,
            })
            .onConflictDoNothing();
        }

        await tx
          .insert(tenant.workflowNode)
          .values({
            id: input.data.id,
            organizationId: input.organizationId,
            workflowId: input.workflowId,
            workflowVersionId: input.workflowVersionId,
            contextId: input.data.contextId,
            type: input.data.type,
            width: input.data.width,
            height: input.data.height,
            color: input.data.color,
            label: input.data.label,
            position: input.data.position,
          })
          .onConflictDoUpdate({
            target: tenant.workflowNode.id,
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
            publishedAt: tenant.workflowVersion.publishedAt,
          })
          .from(tenant.workflowVersion)
          .where(eq(tenant.workflowVersion.id, input.workflowVersionId))
          .limit(1);
        if (!version) {
          throw new Error("Workflow version not found");
        }
        console.log("version", version);
        if (!version.publishedAt) {
          // delete all the execution data as well.
          console.log("deleting node execution data");
          console.warn("TODO: delete node execution data");
          // TODO:
          // await tx
          //   .delete(tenant.workflowExecution)
          //   .where(
          //     and(
          //       eq(tenant.workflowExecution.workflowId, input.workflowId),
          //       eq(
          //         tenant.workflowExecution.workflowVersionId,
          //         input.workflowVersionId,
          //       ),
          //       or(
          //         eq(tenant.workflowExecution.entryContextId, input.data.id),
          //         eq(tenant.workflowExecution.currentContextId, input.data.id),
          //       ),
          //     ),
          //   );
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
          .delete(tenant.workflowNode)
          .where(
            and(
              eq(tenant.workflowNode.workflowId, input.workflowId),
              eq(
                tenant.workflowNode.workflowVersionId,
                input.workflowVersionId,
              ),
              eq(tenant.workflowNode.id, input.data.id),
            ),
          )
          .returning();
        if (!node) {
          throw new Error("Node not found");
        }

        await tx
          .delete(tenant.context)
          .where(and(eq(tenant.context.id, node.contextId)));
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
        .from(tenant.context)
        .where(eq(tenant.context.id, input.contextId))
        .limit(1);
      return context;
    }),

  setContext: protectedProcedure
    .input(
      z.array(
        z.object({
          contextId: z.string(),
          organizationId: z.string(),
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
          .insert(tenant.context)
          .values(
            input.map((i) => ({
              id: i.contextId,
              organizationId: i.organizationId,
              type: i.context.src, // src
              snapshot: i.context.snapshot,
              workflowId: i.workflowId,
              workflowVersionId: i.workflowVersionId,
              parent_id: get(i.context, "snapshot.context.parent.id"),
            })),
          )
          .onConflictDoUpdate({
            target: tenant.context.id,
            set: {
              snapshot: sql`excluded.snapshot`,
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
        .update(tenant.workflowNode)
        .set({
          ...(input.size && input.size),
          ...(input.position && { position: input.position }),
          ...(input.label && { label: input.label }),
        })
        .where(eq(tenant.workflowNode.id, input.id));
    }),
});
