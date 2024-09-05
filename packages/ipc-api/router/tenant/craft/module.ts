import { z } from "zod";

import { eq, tenant } from "@craftgen/database";

import { TRPCError } from "../../../deps.ts";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../../trpc.ts";

export const craftModuleRouter = createTRPCRouter({
  featured: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        count: z.number().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.tDb?.query.workflow.findMany({
        where: (w, { eq, and }) => and(eq(w.public, true)),
        orderBy: (w, { desc }) => desc(w.updatedAt),
        limit: input.count || 20,
        with: {
          organization: true,
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

  bySlug: publicProcedure
    .input(z.object({ moduleSlug: z.string(), orgSlug: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.tDb.query.workflow.findFirst({
        where: (w, { and, eq }) =>
          and(
            eq(w.slug, input.moduleSlug),
            eq(w.organizationSlug, input.orgSlug),
          ),
      });
    }),

  // search: publicProcedure
  //   .input(
  //     z.object({
  //       query: z.string().optional(),
  //       currentModuleId: z.string(),
  //     }),
  //   )
  //   .query(({ ctx, input }) => {
  //     return ctx.db.transaction(async (tx) => {
  //       const workflows = await tx.query.workflow.findMany({
  //         where: (w, { eq, or, ilike, and, not }) =>
  //           and(
  //             not(eq(w.id, input.currentModuleId)),
  //             or(
  //               eq(tenant.workflow.public, true),
  //               ilike(w.name, `%${input.query}%`),
  //               ilike(w.slug, `%${input.query}%`),
  //               ilike(w.organizationSlug, `%${input.query}%`),
  //             ),
  //           ),
  //         orderBy: (workflow, { desc }) => desc(workflow.updatedAt),
  //         limit: 10,
  //       });

  //       return workflows.map((workflow) => ({
  //         id: workflow.id,
  //         name: workflow.name,
  //         slug: workflow.slug,
  //         owner: workflow.organizationSlug,
  //       }));
  //     });
  //   }),

  create: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        public: z.boolean(),
        template: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.tDb?.transaction(async (tx) => {
        const org = await tx.query.organization.findFirst({
          where: (org, { eq }) => eq(org.id, input.orgId),
        });
        if (!org) throw new Error("Project not found");
        // TODO check Ownership.
        const [newWorkflow] = await tx
          .insert(tenant.workflow)
          .values({
            name: input.name,
            slug: input.slug,
            description: input.description,
            organizationId: org?.id,
            organizationSlug: org?.slug,
            public: input.public,
          })
          .returning();

        if (!newWorkflow) throw new Error("Failed to create workflow");
        const [initialVersion] = await tx
          .insert(tenant.workflowVersion)
          .values({
            workflowId: newWorkflow.id,
            organizationId: newWorkflow.organizationId,
          })
          .returning();
        if (!initialVersion)
          throw new Error("Failed to create playground version");

        const [rootContext] = await tx
          .insert(tenant.context)
          .values({
            organizationId: org.id,
            type: "NodeModule",
            workflowId: newWorkflow.id,
            workflowVersionId: initialVersion.id,
          })
          .returning({
            id: tenant.context.id,
          });
        if (!rootContext) throw new Error("Failed to create root context");

        await tx
          .update(tenant.workflowVersion)
          .set({
            contextId: rootContext.id,
          })
          .where(eq(tenant.workflowVersion.id, initialVersion.id));

        return newWorkflow;
      });
    }),

  // update: protectedProcedure
  //   .input(
  //     z.object({
  //       workflowId: z.string(),
  //       args: z.object({
  //         name: z.string(),
  //         description: z.string(),
  //         public: z.boolean(),
  //       }),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     return await ctx.db
  //       .update(tenant.workflow)
  //       .set(input.args)
  //       .where(eq(tenant.workflow.id, input.workflowId))
  //       .returning();
  //   }),

  // delete: protectedProcedure
  //   .input(
  //     z.object({
  //       workflowId: z.string(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     if (!ctx.session.user) {
  //       throw new TRPCError({
  //         code: "UNAUTHORIZED",
  //         message: "You need to be logged in to delete a workflow.",
  //       });
  //     }
  //     // TODO check ownership

  //     return await ctx.db.transaction(async (tx) => {
  //       await tx
  //         .delete(tenant.workflow)
  //         .where(and(eq(tenant.workflow.id, input.workflowId)));
  //     });
  //   }),

  list: publicProcedure
    .input(z.object({ orgSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      let canAccessToPrivate = false;
      if (ctx.auth?.sessionClaims?.orgSlug === input.orgSlug) {
        canAccessToPrivate = true;
      }

      const workflows = await ctx.tDb?.query.workflow.findMany({
        where: (w, { eq, and, sql }) =>
          and(
            eq(w.organizationSlug, input.orgSlug),
            eq(w.public, canAccessToPrivate ? sql`true` : sql`false`),
          ),
        with: {
          versions: {
            orderBy: (workflowVersion, { desc }) => [
              desc(workflowVersion.version),
            ],
            limit: 1,
          },
          organization: {
            columns: {
              slug: true,
            },
          },
        },
      });
      return workflows.map((w) => ({
        ...w,
        version: w.versions[0]!,
      }));
    }),

  // list: publicProcedure
  //   .input(
  //     z.object({
  //       projectSlug: z.string(),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     return await ctx.db.transaction(async (tx) => {
  //       let canAccess = false;
  //       const org = await tx.query.organization.findFirst({
  //         where: (org, { eq }) => eq(org.slug, input.projectSlug),
  //       });
  //       if (!org) throw new TRPCError({ code: "NOT_FOUND" });

  //       if (ctx.session?.user.id) {
  //         // check if user member of project
  //         const member = await tx.query.projectMembers.findFirst({
  //           where: (projectMember, { eq, and }) =>
  //             and(
  //               eq(projectMember.projectId, org.id),
  //               eq(projectMember.userId, ctx.session?.user?.id!),
  //             ),
  //         });
  //         if (member) {
  //           canAccess = true;
  //         }
  //       }
  //       let workflows = [];
  //       if (canAccess) {
  //         workflows = await tx.query.workflow.findMany({
  //           where: (workflow, { eq, and }) =>
  //             and(eq(workflow.projectId, org.id)),
  //           with: {
  //             versions: {
  //               orderBy: (workflowVersion, { desc }) => [
  //                 desc(workflowVersion.version),
  //               ],
  //               limit: 1,
  //             },
  //             project: {
  //               columns: {
  //                 slug: true,
  //               },
  //             },
  //           },
  //         });
  //       } else {
  //         workflows = await tx.query.workflow.findMany({
  //           where: (workflow, { eq, and }) => canAccess ? and(eq(workflow.projectId, org.id)),
  //             and(eq(workflow.projectId, org.id), eq(workflow.public, true)),
  //           with: {
  //             versions: {
  //               orderBy: (workflowVersion, { desc }) => [
  //                 desc(workflowVersion.version),
  //               ],
  //               limit: 1,
  //             },
  //             project: {
  //               columns: {
  //                 slug: true,
  //               },
  //             },
  //           },
  //         });
  //       }

  //       return workflows.map((w) => ({
  //         ...w,
  //         version: w.versions[0]!,
  //       }));
  //     });
  //   }),

  meta: publicProcedure
    .input(z.object({ orgSlug: z.string(), workflowSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.tDb.query.workflow.findFirst({
        where: (w, { eq }) => eq(w.slug, input.workflowSlug),
        with: {
          organization: {
            columns: {
              name: true,
              slug: true,
            },
          },
          versions: {
            orderBy: (workflowVersion, { desc }) => [
              desc(workflowVersion.version),
            ],
            limit: 1,
          },
        },
      });
      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }
      const version = workflow.versions[0];
      return {
        ...workflow,
        version,
      };
    }),
  // meta: publicProcedure
  //   .input(
  //     z.object({
  //       workflowSlug: z.string(),
  //       organizationSlug: z.string(),
  //       version: z.number().optional(),
  //       executionId: z.string().optional(),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     const workflow = await ctx.db.query.workflow.findFirst({
  //       where: (w, { eq, and }) =>
  //         and(
  //           eq(w.slug, input.workflowSlug),
  //           eq(w.organizationSlug, input.organizationSlug),
  //         ),
  //       with: {
  //         organization: true,
  //       },
  //     });
  //     if (!workflow) {
  //       throw new TRPCError({
  //         code: "NOT_FOUND",
  //         message: "Workflow not found",
  //       });
  //     }
  //     if (!workflow.public && !ctx.session?.user) {
  //       throw new TRPCError({
  //         code: "UNAUTHORIZED",
  //         message: "You need to be logged in to access this workflow.",
  //       });
  //     }

  //     const userId = ctx.session?.user?.id;
  //     let readonly = true;
  //     if (userId) {
  //       const [isMember] = await ctx.db
  //         .select()
  //         .from(tenant.organizationMembers)
  //         .where(
  //           and(
  //             eq(
  //               tenant.organizationMembers.organizationId,
  //               workflow.organizationId,
  //             ),
  //             eq(tenant.organizationMembers.userId, userId),
  //           ),
  //         )
  //         .limit(1);

  //       if (isMember) {
  //         readonly = false;
  //       }
  //     }

  //     if (!workflow.public && ctx.session?.user) {
  //       // check if user is a member of the project
  //       const [isMember] = await ctx.db
  //         .select()
  //         .from(tenant.organizationMembers)
  //         .where(
  //           and(
  //             eq(
  //               tenant.organizationMembers.organizationId,
  //               workflow.organizationId,
  //             ),
  //             eq(tenant.organizationMembers.userId, ctx.session.user?.id),
  //           ),
  //         )
  //         .limit(1);
  //       if (!isMember) {
  //         throw new TRPCError({
  //           code: "UNAUTHORIZED",
  //           message:
  //             "You need to be a member of the project to access this workflow.",
  //         });
  //       }
  //     }

  //     let version;
  //     if (!isNil(input.version)) {
  //       version = await ctx.db.query.workflowVersion.findFirst({
  //         where: (workflowVersion, { eq, and }) =>
  //           and(
  //             eq(workflowVersion.workflowId, workflow?.id),
  //             eq(workflowVersion.version, input.version!),
  //           ),
  //       });
  //     } else {
  //       version = await ctx.db.query.workflowVersion.findFirst({
  //         where: (workflowVersion, { eq, and }) =>
  //           and(eq(workflowVersion.workflowId, workflow?.id)),
  //         orderBy: (workflowVersion, { desc }) => [
  //           desc(workflowVersion.version),
  //         ],
  //       });
  //     }

  //     let execution;
  //     // if (input.executionId) {
  //     //   execution = await ctx.db.query.workflowExecution.findFirst({
  //     //     where: (workflowExecution, { eq }) =>
  //     //       eq(workflowExecution.id, input.executionId!),
  //     //   });
  //     // }

  //     return {
  //       ...workflow,
  //       version,
  //       readonly,
  //       execution,
  //     };
  //   }),

  // getById: protectedProcedure
  //   .input(
  //     z.object({
  //       versionId: z.string(),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     // TODO: Check has access.

  //     const version = await ctx.db.query.workflowVersion.findFirst({
  //       where: (workflowVersion, { eq }) =>
  //         eq(workflowVersion.id, input.versionId),
  //       with: {
  //         edges: true,
  //         nodes: true,
  //         contexts: true,
  //         context: true,
  //       },
  //     });

  //     if (!version) {
  //       throw new Error("Version not found");
  //     }

  //     const contentNodes = version.nodes.map((node) => ({
  //       id: node.id,
  //       type: node.type as any,
  //       projectId: node.projectId,
  //       workflowId: node.workflowId,
  //       workflowVersionId: node.workflowVersionId,
  //       contextId: node.contextId,
  //       state: undefined,
  //       nodeExecutionId: undefined,
  //       position: node.position,
  //       width: node.width,
  //       height: node.height,
  //       label: node.label,
  //       color: node.color,
  //     }));

  //     const contentEdges = version.edges.map((edge) => ({
  //       sourceOutput: edge.sourceOutput,
  //       source: edge.source,
  //       targetInput: edge.targetInput,
  //       target: edge.target,
  //       workflowId: edge.workflowId,
  //       workflowVersionId: edge.workflowVersionId,
  //     }));
  //     return {
  //       ...version,
  //       nodes: contentNodes,
  //       edges: contentEdges,
  //     };
  //   }),

  get: publicProcedure
    .input(
      z.object({
        orgSlug: z.string(),
        workflowSlug: z.string(),
        version: z.number(),
        executionId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const isOwner = ctx.auth?.sessionClaims?.orgSlug === input.orgSlug;
      const workflow = await ctx.tDb.query.workflow.findFirst({
        where: (w, { eq, and, sql }) =>
          and(
            eq(w.slug, input.workflowSlug),
            eq(w.organizationSlug, input.orgSlug),
            isOwner ? eq(w.public, true) : sql`true`,
          ),
        with: {
          organization: {
            columns: {
              id: true,
            },
          },
          versions: {
            where: (workflowVersion, { eq }) =>
              eq(workflowVersion.version, input.version),
            orderBy: (workflowVersion, { desc }) => [
              desc(workflowVersion.version),
            ],
            limit: 1,
          },
        },
      });
      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }
      const version = workflow.versions[0];
      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Version not found",
        });
      }
      return {
        ...workflow,
        version,
      };
    }),

  // get: publicProcedure
  //   .input(
  //     z.object({
  //       workflowSlug: z.string(),
  //       organizationSlug: z.string(),
  //       version: z.number(),
  //       executionId: z.string().optional(),
  //       published: z.boolean().optional().default(true),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     return await ctx.db.transaction(async (tx) => {
  //       const w = await tx.query.workflow.findFirst({
  //         where: (workflow, { eq, and }) =>
  //           and(
  //             eq(workflow.slug, input.workflowSlug),
  //             eq(workflow.organizationSlug, input.organizationSlug),
  //           ),
  //         with: {
  //           organization: {
  //             columns: {
  //               id: true,
  //             },
  //           },
  //         },
  //       });
  //       if (!w) {
  //         throw new TRPCError({
  //           code: "NOT_FOUND",
  //           message: "Workflow not found",
  //         });
  //       }
  //       if (!w.public && !ctx.session?.user) {
  //         throw new TRPCError({
  //           code: "UNAUTHORIZED",
  //           message: "You need to be logged in to access this workflow.",
  //         });
  //       }
  //       const userId = ctx.session?.user?.id;
  //       let readonly = true;
  //       if (userId) {
  //         const [isMember] = await tx
  //           .select()
  //           .from(tenant.organizationMembers)
  //           .where(
  //             and(
  //               eq(tenant.organizationMembers.organizationId, w.organizationId),
  //               eq(tenant.organizationMembers.userId, userId),
  //             ),
  //           )
  //           .limit(1);

  //         if (isMember) {
  //           readonly = false;
  //         }
  //       }

  //       const workflow = await tx.query.workflow.findFirst({
  //         where: (workflow, { eq }) => eq(workflow.id, w.id),
  //         with: {
  //           organization: true,
  //           versions: {
  //             where: (workflowVersion, { eq }) =>
  //               eq(workflowVersion.version, input.version),
  //             orderBy: (workflowVersion, { desc }) => [
  //               desc(workflowVersion.version),
  //             ],
  //             limit: 1,
  //             with: {
  //               // executions: {
  //               //   // where: (workflowExecution, { eq }) =>
  //               //   //   input.executionId && !readonly // if readonly, don't filter by executionId
  //               //   //     ? eq(workflowExecution.id, input.executionId)
  //               //   //     : sql`false`,
  //               //   limit: 1,
  //               // },
  //               edges: true,
  //               contexts: true,
  //               context: true,
  //               nodes: {
  //                 with: {
  //                   workflowVersion: {
  //                     columns: {
  //                       version: true,
  //                     },
  //                   },
  //                   organization: {
  //                     columns: {
  //                       slug: true,
  //                     },
  //                   },
  //                   workflow: {
  //                     columns: {
  //                       slug: true,
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       });
  //       if (!w) {
  //         throw new Error("Playground not found");
  //       }

  //       const version = workflow?.versions[0];

  //       if (!version) {
  //         throw new Error("Playground version not found");
  //       }
  //       if (version && version.publishedAt) {
  //         readonly = true;
  //       }
  //       const contentNodes = version.nodes.map((node) => ({
  //         id: node.id,
  //         type: node.type as any,
  //         organizationId: node.organizationId,
  //         workflowId: node.workflowId,
  //         workflowVersionId: node.workflowVersionId,
  //         contextId: node.contextId,
  //         position: node.position,
  //         width: node.width,
  //         height: node.height,
  //         label: node.label,
  //         color: node.color,
  //       }));
  //       const contentEdges = version.edges.map((edge) => ({
  //         sourceOutput: edge.sourceOutput,
  //         source: edge.source,
  //         targetInput: edge.targetInput,
  //         target: edge.target,
  //         workflowId: edge.workflowId,
  //         workflowVersionId: edge.workflowVersionId,
  //       }));

  //       const res = {
  //         ...workflow,
  //         currentVersion: workflow.versions.length > 0 ? version.version : 0,
  //         context: version.context,
  //         nodes: contentNodes,
  //         edges: contentEdges,
  //         contexts: version.contexts.filter(
  //           (c) => c.id !== version.context?.id,
  //         ),
  //         version,
  //         // execution: workflow?.versions[0]?.executions[0],
  //         readonly,
  //       };
  //       return res;
  //     });
  //   }),
});
