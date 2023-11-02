import { and, eq, schema, sql } from "@seocraft/supabase/db";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const craftModuleRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        workflowSlug: z.string(),
        projectSlug: z.string(),
        version: z.number(),
        executionId: z.string().optional(),
        published: z.boolean().optional().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const project = await tx.query.project.findFirst({
          where: (project, { eq }) => eq(project.slug, input.projectSlug),
          columns: {
            id: true,
          },
        });
        if (!project) {
          throw new Error("Project not found");
        }
        const userId = ctx.session?.user?.id;
        let readonly = true;
        if (userId) {
          const [isMember] = await tx
            .select()
            .from(schema.projectMembers)
            .where(
              and(
                eq(schema.projectMembers.projectId, project.id),
                eq(schema.projectMembers.userId, userId),
              ),
            )
            .limit(1);

          if (isMember) {
            readonly = false;
          }
        }

        const workflow = await tx.query.workflow.findFirst({
          where: (workflow, { eq, and }) =>
            and(
              eq(workflow.slug, input.workflowSlug),
              eq(workflow.projectId, project.id),
            ),
          with: {
            project: true,
            versions: {
              where: (workflowVersion, { eq }) =>
                eq(workflowVersion.version, input.version),
              orderBy: (workflowVersion, { desc }) => [
                desc(workflowVersion.version),
              ],
              limit: 1,
              with: {
                executions: {
                  where: (workflowExecution, { eq }) =>
                    input.executionId
                      ? eq(workflowExecution.id, input.executionId)
                      : sql`false`,
                  limit: 1,
                },
                edges: true,
                nodes: {
                  with: {
                    nodeExectutions: {
                      where: (nodeExecutionData, { eq }) =>
                        input.executionId
                          ? eq(
                              nodeExecutionData.workflowExecutionId,
                              input.executionId,
                            )
                          : sql`false`,
                      limit: 1,
                      orderBy: (nodeExecutionData, { desc }) => [
                        desc(nodeExecutionData.createdAt),
                      ],
                    },
                    workflowVersion: {
                      columns: {
                        version: true,
                      },
                    },
                    project: {
                      columns: {
                        slug: true,
                      },
                    },
                    workflow: {
                      columns: {
                        slug: true,
                      },
                    },
                    context: true,
                  },
                },
              },
            },
          },
        });
        if (!workflow) {
          throw new Error("Playground not found");
        }

        const version = workflow?.versions[0];
        if (!version) {
          throw new Error("Playground version not found");
        }
        if (version && version.publishedAt) {
          readonly = true;
        }

        return {
          ...workflow,
          currentVersion: workflow.versions.length > 0 ? version.version : 0,
          version,
          execution: workflow?.versions[0]?.executions[0],
          readonly,
        };
      });
    }),
});
