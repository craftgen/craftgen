"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import { and, db, eq, projectMembers } from "@craftgen/db/db";

import { action } from "@/lib/safe-action";

export const getWorkflowMeta = action(
  z.object({
    workflowSlug: z.string(),
    projectSlug: z.string(),
    version: z.number().optional(),
  }),
  async (input) => {
    const supabase = createServerActionClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const workflow = await db.query.workflow.findFirst({
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
    if (!workflow.public && !user) {
      throw new Error("Workflow not found 3");
    }

    if (!workflow.public && user) {
      // check if user is a member of the project
      const [isMember] = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, workflow.projectId),
            eq(projectMembers.userId, user?.id),
          ),
        )
        .limit(1);
      if (!isMember) {
        throw new Error("Workflow not found 2");
      }
    }

    let version;
    if (input.version) {
      version = await db.query.workflowVersion.findFirst({
        where: (workflowVersion, { eq, and }) =>
          and(
            eq(workflowVersion.workflowId, workflow?.id),
            eq(workflowVersion.version, input.version!),
          ),
      });
    } else {
      version = await db.query.workflowVersion.findFirst({
        where: (workflowVersion, { eq, and, isNotNull }) =>
          and(
            eq(workflowVersion.workflowId, workflow?.id),
            isNotNull(workflowVersion.publishedAt),
          ),
        orderBy: (workflowVersion, { desc }) => [desc(workflowVersion.version)],
      });
    }

    return {
      ...workflow,
      version,
    };
  },
);
