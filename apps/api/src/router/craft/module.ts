import { z } from "zod";
import { isNil } from "lodash-es";

import { and, eq, schema, sql } from "@seocraft/supabase/db";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const craftModuleRouter = createTRPCRouter({
  meta: protectedProcedure
    .input(
      z.object({
        workflowSlug: z.string(),
        projectSlug: z.string(),
        version: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.db.query.workflow.findFirst({
        where: (workflow, { eq, and }) =>
          and(
            eq(workflow.slug, input.workflowSlug),
            eq(workflow.projectSlug, input.projectSlug),
          ),
        with: {
          project: true,
        },
      });
      if (!workflow) {
        throw new Error("Workflow not found 4");
      }
      if (!workflow.public && !ctx.session.user) {
        throw new Error("Workflow not found 3");
      }

      const userId = ctx.session?.user?.id;
      let readonly = true;
      if (userId) {
        const [isMember] = await ctx.db
          .select()
          .from(schema.projectMembers)
          .where(
            and(
              eq(schema.projectMembers.projectId, workflow.project.id),
              eq(schema.projectMembers.userId, userId),
            ),
          )
          .limit(1);

        if (isMember) {
          readonly = false;
        }
      }

      if (!workflow.public && ctx.session.user) {
        // check if user is a member of the project
        const [isMember] = await ctx.db
          .select()
          .from(schema.projectMembers)
          .where(
            and(
              eq(schema.projectMembers.projectId, workflow.projectId),
              eq(schema.projectMembers.userId, ctx.session.user?.id),
            ),
          )
          .limit(1);
        if (!isMember) {
          throw new Error("Workflow not found 2");
        }
      }

      let version;
      if (!isNil(input.version)) {
        version = await ctx.db.query.workflowVersion.findFirst({
          where: (workflowVersion, { eq, and }) =>
            and(
              eq(workflowVersion.workflowId, workflow?.id),
              eq(workflowVersion.version, input.version!),
            ),
        });
      } else {
        version = await ctx.db.query.workflowVersion.findFirst({
          where: (workflowVersion, { eq, and, isNotNull }) =>
            and(
              eq(workflowVersion.workflowId, workflow?.id),
              isNotNull(workflowVersion.publishedAt),
            ),
          orderBy: (workflowVersion, { desc }) => [
            desc(workflowVersion.version),
          ],
        });
      }

      return {
        ...workflow,
        version,
        readonly,
      };
    }),

  getById: protectedProcedure
    .input(
      z.object({
        versionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // TODO: Check has access.

      const version = await ctx.db.query.workflowVersion.findFirst({
        where: (workflowVersion, { eq }) =>
          eq(workflowVersion.id, input.versionId),
        with: {
          edges: true,
          nodes: {
            with: {
              // context: {
              //   columns: {
              //     state: true,
              //   },
              // },
            },
          },
        },
      });
      if (!version) {
        throw new Error("Version not found");
      }
      const contentNodes = version.nodes.map((node) => ({
        id: node.id,
        type: node.type as any,
        projectId: node.projectId,
        workflowId: node.workflowId,
        workflowVersionId: node.workflowVersionId,
        contextId: node.contextId,
        state: undefined,
        nodeExecutionId: undefined,
        position: node.position,
        width: node.width,
        height: node.height,
        label: node.label,
        color: node.color,
      }));
      const contentEdges = version.edges.map((edge) => ({
        sourceOutput: edge.sourceOutput,
        source: edge.source,
        targetInput: edge.targetInput,
        target: edge.target,
        workflowId: edge.workflowId,
        workflowVersionId: edge.workflowVersionId,
      }));
      return {
        ...version,
        nodes: contentNodes,
        edges: contentEdges,
      };
    }),
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
                contexts: true,
                nodes: {
                  with: {
                    // nodeExectutions: {
                    //   where: (nodeExecutionData, { eq }) =>
                    //     input.executionId
                    //       ? eq(
                    //           nodeExecutionData.workflowExecutionId,
                    //           input.executionId,
                    //         )
                    //       : sql`false`,
                    //   limit: 1,
                    //   orderBy: (nodeExecutionData, { desc }) => [
                    //     desc(nodeExecutionData.createdAt),
                    //   ],
                    // },
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
                    // context: true,
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
        const contentNodes = version.nodes.map((node) => ({
          id: node.id,
          type: node.type as any,
          projectId: node.projectId,
          workflowId: node.workflowId,
          workflowVersionId: node.workflowVersionId,
          contextId: node.contextId,
          
          // state: node.nodeExectutions.map((ne) => ne.state)[0],
          // nodeExecutionId: node.nodeExectutions.map((ne) => ne.id)[0],
          position: node.position,
          width: node.width,
          height: node.height,
          label: node.label,
          color: node.color,
        }));
        const contentEdges = version.edges.map((edge) => ({
          sourceOutput: edge.sourceOutput,
          source: edge.source,
          targetInput: edge.targetInput,
          target: edge.target,
          workflowId: edge.workflowId,
          workflowVersionId: edge.workflowVersionId,
        }));

        const res = {
          ...workflow,
          currentVersion: workflow.versions.length > 0 ? version.version : 0,
          nodes: contentNodes,
          edges: contentEdges,
          contexts: version.contexts,
          version,
          execution: workflow?.versions[0]?.executions[0],
          readonly,
        };
        return res;
      });
    }),
});
