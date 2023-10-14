"use server";

import { db } from "@seocraft/supabase/db";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const getWorkflows = async (projectId: string) => {
  const supabase = createServerActionClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return await db.transaction(async (tx) => {
    let canAccess = false;
    if (user) {
      // check if user member of project
      const member = await db.query.projectMembers.findFirst({
        where: (projectMember, { eq, and }) =>
          and(
            eq(projectMember.projectId, projectId),
            eq(projectMember.userId, user?.id)
          ),
      });
      if (member) {
        canAccess = true;
      }
    }
    let workflows = [];
    if (canAccess) {
      workflows = await db.query.workflow.findMany({
        where: (workflow, { eq, and }) =>
          and(eq(workflow.projectId, projectId)),
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
      workflows = await db.query.workflow.findMany({
        where: (workflow, { eq, and }) =>
          and(eq(workflow.projectId, projectId), eq(workflow.public, true)),
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
      version: w.versions[0],
    }));
  });
};
