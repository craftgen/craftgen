import { and, desc, eq, schema } from "@seocraft/supabase/db";
import { isEqual } from "lodash-es";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const craftVersionRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        projectSlug: z.string(),
        workflowSlug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {}),

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
              let contextId;
              const previousContextState = contextState.previousContext?.state;
              if (isEqual(previousContextState, contextState.state)) {
                console.log("REUSING CONTEXT");
                contextId = contextState.previousContext?.id;
              } else {
                console.log("CREATING NEW CONTEXT");
                const [cloneContext] = await tx
                  .insert(schema.context)
                  .values({
                    type: contextState.type,
                    project_id: contextState.project_id,
                    previousContextId: contextState.id,
                    state: contextState.state,
                  })
                  .returning();
                if (!cloneContext) {
                  throw new Error("Could not create context");
                }
                contextId = cloneContext.id;
              }
              if (!contextId) {
                throw new Error("Could not find or create context");
              }

              const [cloneNode] = await tx
                .insert(schema.workflowNode)
                .values({
                  ...workflowNodeMeta,
                  contextId,
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

        console.log("COPYING EDGES", edges);
        if (edges.length > 0) {
          await tx.insert(schema.workflowEdge).values(
            edges.map((edge) => ({
              ...edge,
              workflowVersionId: newVersion.id,
            })),
          );
        }

        return newVersion;
      });
    }),
});
