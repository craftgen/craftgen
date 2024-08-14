import { TRPCError } from "@trpc/server";
import { isNil } from "lodash-es";
import { z } from "zod";

import { and, eq, schema, sql, workflow } from "@craftgen/db/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

export const craftModuleRouter = createTRPCRouter({
  featured: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        count: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.workflow.findMany({
        where: (workflow, { eq, and }) => and(eq(workflow.public, true)),
        orderBy: (workflow, { desc }) => desc(workflow.updatedAt),
        limit: input.count || 20,
        with: {
          project: true,
          versions: {
            columns: {
              version: true,
            },
            orderBy: (version, { desc }) => desc(version.version),
            limit: 1,
          },
        },
      });
    }),
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        currentModuleId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const workflows = await tx.query.workflow.findMany({
          where: (workflow, { eq, or, ilike, and, not }) =>
            and(
              not(eq(workflow.id, input.currentModuleId)),
              or(
                eq(workflow.public, true),
                ilike(workflow.name, `%${input.query}%`),
                ilike(workflow.slug, `%${input.query}%`),
                ilike(workflow.projectSlug, `%${input.query}%`),
              ),
            ),
          orderBy: (workflow, { desc }) => desc(workflow.updatedAt),
          limit: 10,
        });

        return workflows.map((workflow) => ({
          id: workflow.id,
          name: workflow.name,
          slug: workflow.slug,
          owner: workflow.projectSlug,
        }));
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        public: z.boolean(),
        template: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newPlayground = await ctx.db.transaction(async (tx) => {
        const project = await tx.query.project.findFirst({
          where: (project, { eq }) => eq(project.id, input.projectId),
        });
        if (!project) throw new Error("Project not found");
        // TODO check Ownership.
        const [newWorkflow] = await tx
          .insert(schema.workflow)
          .values({
            name: input.name,
            slug: input.slug,
            description: input.description,
            projectId: project?.id,
            projectSlug: project?.slug,
            public: input.public,
          })
          .returning();

        if (!newWorkflow) throw new Error("Failed to create workflow");
        const [initialVersion] = await tx
          .insert(schema.workflowVersion)
          .values({
            workflowId: newWorkflow.id,
            projectId: newWorkflow.projectId,
          })
          .returning();
        if (!initialVersion)
          throw new Error("Failed to create playground version");

        const [rootContext] = await tx
          .insert(schema.context)
          .values({
            project_id: project.id,
            type: "NodeModule",
            workflow_id: newWorkflow?.id,
            workflow_version_id: initialVersion.id,
          })
          .returning({
            id: schema.context.id,
          });
        if (!rootContext) throw new Error("Failed to create root context");

        await tx
          .update(schema.workflowVersion)
          .set({
            contextId: rootContext.id,
          })
          .where(eq(schema.workflowVersion.id, initialVersion.id));

        return newWorkflow;
      });
      return newPlayground;
    }),

  update: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        args: z.object({
          name: z.string(),
          description: z.string(),
          public: z.boolean(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(workflow)
        .set(input.args)
        .where(eq(workflow.id, input.workflowId))
        .returning();
    }),

  delete: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You need to be logged in to delete a workflow.",
        });
      }
      // TODO check ownership

      return await ctx.db.transaction(async (tx) => {
        await tx
          .delete(schema.workflow)
          .where(and(eq(schema.workflow.id, input.workflowId)));
      });
    }),
  list: publicProcedure
    .input(
      z.object({
        projectSlug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        let canAccess = false;
        const project = await tx.query.project.findFirst({
          where: (project, { eq }) => eq(project.slug, input.projectSlug),
        });
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });

        if (ctx.session?.user.id) {
          // check if user member of project
          const member = await tx.query.projectMembers.findFirst({
            where: (projectMember, { eq, and }) =>
              and(
                eq(projectMember.projectId, project.id),
                eq(projectMember.userId, ctx.session?.user?.id!),
              ),
          });
          if (member) {
            canAccess = true;
          }
        }
        let workflows = [];
        if (canAccess) {
          workflows = await tx.query.workflow.findMany({
            where: (workflow, { eq, and }) =>
              and(eq(workflow.projectId, project.id)),
            with: {
              versions: {
                orderBy: (workflowVersion, { desc }) => [
                  desc(workflowVersion.version),
                ],
                limit: 1,
              },
              project: {
                columns: {
                  slug: true,
                },
              },
            },
          });
        } else {
          workflows = await tx.query.workflow.findMany({
            where: (workflow, { eq, and }) =>
              and(
                eq(workflow.projectId, project.id),
                eq(workflow.public, true),
              ),
            with: {
              versions: {
                orderBy: (workflowVersion, { desc }) => [
                  desc(workflowVersion.version),
                ],
                limit: 1,
              },
              project: {
                columns: {
                  slug: true,
                },
              },
            },
          });
        }

        return workflows.map((w) => ({
          ...w,
          version: w.versions[0]!,
        }));
      });
    }),
  meta: publicProcedure
    .input(
      z.object({
        workflowSlug: z.string(),
        projectSlug: z.string(),
        version: z.number().optional(),
        executionId: z.string().optional(),
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }
      if (!workflow.public && !ctx.session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You need to be logged in to access this workflow.",
        });
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

      if (!workflow.public && ctx.session?.user) {
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
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "You need to be a member of the project to access this workflow.",
          });
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
          where: (workflowVersion, { eq, and }) =>
            and(eq(workflowVersion.workflowId, workflow?.id)),
          orderBy: (workflowVersion, { desc }) => [
            desc(workflowVersion.version),
          ],
        });
      }

      let execution;
      if (input.executionId) {
        execution = await ctx.db.query.workflowExecution.findFirst({
          where: (workflowExecution, { eq }) =>
            eq(workflowExecution.id, input.executionId!),
        });
      }

      return {
        ...workflow,
        version,
        readonly,
        execution,
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
          nodes: true,
          contexts: true,
          context: true,
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
  get: publicProcedure
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
        const w = await tx.query.workflow.findFirst({
          where: (workflow, { eq, and }) =>
            and(
              eq(workflow.slug, input.workflowSlug),
              eq(workflow.projectSlug, input.projectSlug),
            ),
          with: {
            project: {
              columns: {
                id: true,
              },
            },
          },
        });
        if (!w) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }
        if (!w.public && !ctx.session?.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You need to be logged in to access this workflow.",
          });
        }
        const userId = ctx.session?.user?.id;
        let readonly = true;
        if (userId) {
          const [isMember] = await tx
            .select()
            .from(schema.projectMembers)
            .where(
              and(
                eq(schema.projectMembers.projectId, w.projectId),
                eq(schema.projectMembers.userId, userId),
              ),
            )
            .limit(1);

          if (isMember) {
            readonly = false;
          }
        }

        const workflow = await tx.query.workflow.findFirst({
          where: (workflow, { eq }) => eq(workflow.id, w.id),
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
                    input.executionId && !readonly // if readonly, don't filter by executionId
                      ? eq(workflowExecution.id, input.executionId)
                      : sql`false`,
                  limit: 1,
                },
                edges: true,
                contexts: true,
                context: true,
                nodes: {
                  with: {
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
                  },
                },
              },
            },
          },
        });
        if (!w) {
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
          context: version.context,
          nodes: contentNodes,
          edges: contentEdges,
          contexts: version.contexts.filter(
            (c) => c.id !== version.context?.id,
          ),
          version,
          execution: workflow?.versions[0]?.executions[0],
          readonly,
        };
        return res;
      });
    }),
});
