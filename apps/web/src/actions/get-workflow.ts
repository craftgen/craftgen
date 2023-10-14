"use server";

import { action } from "@/lib/safe-action";
import { db, projectMembers, sql, eq, and } from "@seocraft/supabase/db";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

export const getWorkflow = action(
  z.object({
    workflowSlug: z.string(),
    projectSlug: z.string(),
    version: z.number(),
    executionId: z.string().optional(),
    published: z.boolean().optional().default(true),
  }),
  async (params) => {
    const supabase = createServerActionClient({ cookies });
    const session = await supabase.auth.getSession();

    return await db.transaction(async (tx) => {
      const project = await tx.query.project.findFirst({
        where: (project, { eq }) => eq(project.slug, params.projectSlug),
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
              eq(projectMembers.userId, userId)
            )
          )
          .limit(1);

        if (isMember) {
          readonly = false;
        }
      }

      const workflow = await tx.query.workflow.findFirst({
        where: (workflow, { eq, and }) =>
          and(
            eq(workflow.slug, params.workflowSlug),
            eq(workflow.projectId, project.id)
          ),
        with: {
          project: true,
          versions: {
            where: (workflowVersion, { eq }) =>
              eq(workflowVersion.version, params.version),
            orderBy: (workflowVersion, { desc }) => [
              desc(workflowVersion.version),
            ],
            limit: 1,
            with: {
              executions: {
                where: (workflowExecution, { eq }) =>
                  params.executionId
                    ? eq(workflowExecution.id, params.executionId)
                    : sql`false`,
                limit: 1,
              },
              edges: true,
              nodes: {
                with: {
                  nodeExectutions: {
                    where: (nodeExecutionData, { eq }) =>
                      params.executionId
                        ? eq(
                            nodeExecutionData.workflowExecutionId,
                            params.executionId
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
      if (version && version.publishedAt) {
        readonly = true;
      }

      return {
        ...workflow,
        currentVersion:
          workflow.versions.length > 0 ? workflow.versions[0].version : 0,
        version,
        execution: workflow?.versions[0]?.executions[0],
        readonly,
      };
    });
  }
);
