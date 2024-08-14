import { get, isEqual, isNil, set } from "lodash-es";
import { z } from "zod";

import { and, desc, eq, schema } from "@craftgen/db/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

export const craftVersionRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        workflowId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const versions = await tx.query.workflowVersion.findMany({
          where: (workflowVersion, { eq }) =>
            eq(workflowVersion.workflowId, input.workflowId),
          orderBy: (workflowVersion) => desc(workflowVersion.version),
          with: {
            workflow: true,
          },
        });
        if (!ctx.session?.user?.id) {
          const workflow = await tx.query.workflow.findFirst({
            where: (workflow, { eq }) => eq(workflow.id, input.workflowId),
            columns: {
              public: true,
            },
          });
          if (!workflow?.public) {
            throw new Error("Not authorized");
          }
        }
        return versions;
      });
    }),

  release: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        changeLog: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [versionRes] = await tx
          .select({
            latestVersionId: schema.workflowVersion.id,
            latestVersion: schema.workflowVersion.version,
            projectId: schema.workflow.projectId,
          })
          .from(schema.workflowVersion)
          .where(and(eq(schema.workflowVersion.workflowId, input.workflowId)))
          .leftJoin(
            schema.workflow,
            eq(schema.workflow.id, schema.workflowVersion.workflowId),
          )
          .orderBy(desc(schema.workflowVersion.version))
          .limit(1);
        if (!versionRes) {
          throw new Error("Could not find previous version to create new");
        }
        const { latestVersionId, latestVersion, projectId } = versionRes;
        if (!projectId) {
          throw new Error("Project not found");
        }
        // Publish the latest version
        await tx
          .update(schema.workflowVersion)
          .set({ publishedAt: new Date(), changeLog: input.changeLog })
          .where(
            and(
              eq(schema.workflowVersion.workflowId, input.workflowId),
              eq(schema.workflowVersion.version, latestVersion),
            ),
          );

        const [newVersion] = await tx
          .insert(schema.workflowVersion)
          .values({
            workflowId: input.workflowId,
            version: latestVersion + 1,
            previousVersionId: latestVersionId,
            projectId,
          })
          .returning();
        if (!newVersion) {
          throw new Error("Could not create new version");
        }

        // Copy nodes
        const previousWorkflowVersionWithGraph =
          await tx.query.workflowVersion.findFirst({
            where: (workflowVersion, { eq }) =>
              eq(workflowVersion.id, latestVersionId),
            with: {
              nodes: {
                with: {
                  context: {
                    with: {
                      previousContext: true,
                    },
                  },
                },
              },
              edges: true,
            },
          });
        if (!previousWorkflowVersionWithGraph) {
          throw new Error("Could not find workflow version");
        }

        const edges = previousWorkflowVersionWithGraph.edges;

        console.log("COPYING NODES", previousWorkflowVersionWithGraph.nodes);
        // copy over nodes;
        await Promise.all(
          previousWorkflowVersionWithGraph.nodes.map(
            async ({ id, ...node }) => {
              const { context: contextState, ...workflowNodeMeta } = node;

              const contextsWithChildren = new Map();
              contextsWithChildren.set(contextState.id, contextState);

              const getChildren = async (contextId: string) => {
                const childrens = await tx.query.context.findMany({
                  where: (context, { eq }) => eq(context.parent_id, contextId),
                });
                for (const child of childrens) {
                  contextsWithChildren.set(child.id, child);
                }
                for (const child of childrens) {
                  await getChildren(child.id);
                }
              };
              await getChildren(contextState.id);

              for (const [previousId, context] of contextsWithChildren) {
                if (isEqual(context.state, context.previousContext?.state)) {
                  // THIS IS NO LONGER THE CASE.
                  // WE are keeping the connection relations in the actors so in each release there's a new actor happening.
                  console.log("REUSING CONTEXT");
                } else {
                  console.log(
                    "CREATING NEW CONTEXT",
                    context,
                    context.previousContext,
                  );
                  const [cloneContext] = await tx
                    .insert(schema.context)
                    .values({
                      type: context.type,
                      project_id: context.project_id,
                      previousContextId: context.id,
                      state: context.state,
                      parent_id: context.parent_id,
                      workflow_id: input.workflowId,
                      workflow_version_id: newVersion.id,
                    })
                    .returning();

                  contextsWithChildren.set(previousId, cloneContext);
                  if (!cloneContext) {
                    throw new Error("Could not create context");
                  }
                }
              }
              console.log("##".repeat(20));
              console.log({
                contextsWithChildren,
              });

              for (const [previousId, context] of contextsWithChildren) {
                const changes: Partial<{
                  parent_id: string;
                  state: any;
                }> = {};
                console.log({ previousId, context, changes });
                changes.state = { ...context.state };
                if (!isNil(context.parent_id)) {
                  const parent = contextsWithChildren.get(context.parent_id);
                  if (context.parent_id !== parent.id) {
                    changes.parent_id = parent.id;
                  }
                  if (get(changes.state, "context.parent.id")) {
                    set(changes.state, "context.parent.id", parent.id);
                  }
                }

                // DEPRECATED TODO:
                // chain(changes.state)
                //   .get("context.outputSockets", {})
                //   .toPairs()
                //   .forEach(([key, value]) => {
                //     const connections = get(value, "x-connection", {});
                //     chain(connections)
                //       .entries()
                //       .forEach(([contextId, portConfig]) => {
                //         console.log("OUTPUTSOCKET", key, contextId, portConfig);
                //         const parent = contextsWithChildren.get(contextId);
                //         if (contextId === parent.id) {
                //           return;
                //         }
                //         console.log(
                //           "BEFORE",
                //           get(
                //             changes.state,
                //             `context.outputSockets.${key}.x-connection`,
                //           ),
                //         );
                //         // remove old connection
                //         unset(
                //           changes.state,
                //           `context.outputSockets.${key}.x-connection.${contextId}`,
                //         );
                //         // add new connection
                //         set(
                //           changes.state,
                //           `context.outputSockets.${key}.x-connection.${parent.id}`,
                //           portConfig,
                //         );
                //         set(
                //           changes.state,
                //           `context.outputSockets.${key}.x-connection.${parent.id}.actorRef.id`,
                //           parent.id,
                //         );
                //         console.log(
                //           "BEFORE",
                //           get(
                //             changes.state,
                //             `context.outputSockets.${key}.x-connection`,
                //           ),
                //         );
                //       })
                //       .value();
                //   })
                //   .value();

                // chain(changes.state)
                //   .get("context.inputSockets", {})
                //   .toPairs()
                //   .forEach(([key, value]) => {
                //     const connections = get(value, "x-connection", {});
                //     chain(connections)
                //       .entries()
                //       .forEach(([contextId, portConfig]) => {
                //         const parent = contextsWithChildren.get(contextId);
                //         if (contextId === parent.id) {
                //           return;
                //         }
                //         // remove old connection
                //         unset(
                //           changes.state,
                //           `context.inputSockets.${key}.x-connection.${contextId}`,
                //         );
                //         // add new connection
                //         set(
                //           changes.state,
                //           `context.inputSockets.${key}.x-connection.${parent.id}`,
                //           portConfig,
                //         );
                //         set(
                //           changes.state,
                //           `context.inputSockets.${key}.x-connection.${parent.id}.actorRef.id`,
                //           parent.id,
                //         );
                //       });
                //   if (get(value, "x-actor-config")) {
                //     const config = get(value, "x-actor-config", {});
                //     // Fix x-actor-config
                //     Object.entries(config).forEach(([actorType, value]) => {
                //       const actorId = get(value, "actorId");
                //       if (actorId) {
                //         const parent = contextsWithChildren.get(actorId);
                //         if (actorId !== parent.id) {
                //           set(
                //             changes.state,
                //             `context.inputSockets.${key}.x-actor-config.${actorType}.actorId`,
                //             parent.id,
                //           );
                //         }
                //       }
                //     });

                //     // Fix x-actor-ref-id
                //     const parent = contextsWithChildren.get(
                //       get(value, "x-actor-ref-id"),
                //     );
                //     if (parent.id !== get(value, "x-actor-ref-id")) {
                //       set(
                //         changes.state,
                //         `context.inputSockets.${key}.x-actor-ref-id`,
                //         parent.id,
                //       );
                //     }
                //   }
                // })
                // .value();

                await tx
                  .update(schema.context)
                  .set({
                    ...changes,
                  })
                  .where(eq(schema.context.id, context.id));
              }

              const nodeContextId = contextsWithChildren.get(
                contextState.id,
              ).id;

              const [cloneNode] = await tx
                .insert(schema.workflowNode)
                .values({
                  ...workflowNodeMeta,
                  contextId: nodeContextId,
                  workflowVersionId: newVersion.id,
                })
                .returning();

              if (!cloneNode) {
                throw new Error("Could not create node");
              }
              edges.forEach(async (edge) => {
                if (edge.source === id) {
                  edge.source = cloneNode.id;
                }
                if (edge.target === id) {
                  edge.target = cloneNode.id;
                }
              });
            },
          ),
        );

        if (edges.length > 0) {
          await tx.insert(schema.workflowEdge).values(
            edges.map((edge) => ({
              ...edge,
              workflowVersionId: newVersion.id,
            })),
          );
        }

        return tx.query.workflowVersion.findFirst({
          where: (workflowVersion, { eq }) =>
            eq(workflowVersion.id, newVersion.id),
          with: {
            project: true,
            workflow: true,
          },
        });
      });
    }),
});
