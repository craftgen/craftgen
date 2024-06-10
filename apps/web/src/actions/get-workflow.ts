"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import { and, db, eq, projectMembers, sql } from "@craftgen/db/db";

import { action } from "@/lib/safe-action";

export const getWorkflow = action(
  z.object({
    workflowSlug: z.string(),
    projectSlug: z.string(),
    version: z.number(),
    executionId: z.string().optional(),
    published: z.boolean().optional().default(true),
  }),
  async (input) => {
    const supabase = createServerActionClient({ cookies });
    const session = await supabase.auth.getSession();

    return await db.transaction(async (tx) => {
      const project = await tx.query.project.findFirst({
        where: (project, { eq }) => eq(project.slug, input.projectSlug),
        columns: {
          id: true,
        },
      });
      if (!project) {
        throw new Error("Project not found");
      }
      const userId = session?.data?.session?.user?.id;
      let readonly = true;
      if (userId) {
        const [isMember] = await tx
          .select()
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, project.id),
              eq(projectMembers.userId, userId),
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
        throw new Error("Version not found");
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
        context: node.context.state,
        state: node.nodeExectutions.map((ne) => ne.state)[0],
        nodeExecutionId: node.nodeExectutions.map((ne) => ne.id)[0],
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
        ...workflow,
        currentVersion: version.version,
        nodes: contentNodes,
        edges: contentEdges,
        version,
        execution: workflow?.versions[0]?.executions[0],
        readonly,
      };
    });
  },
);
