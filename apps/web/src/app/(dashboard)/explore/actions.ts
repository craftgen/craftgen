"use server";

import { db } from "@craftgen/db/db";

import { createClient } from "@/utils/supabase/server";

export const getUserProjects = async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }
  return await db.query.projectMembers.findMany({
    where: (projectMembers, { eq }) => eq(projectMembers.userId, user?.id),
    with: {
      project: true,
    },
  });
};

export const getFeaturedWorkflows = async () => {
  return await db.query.workflow.findMany({
    where: (workflow, { eq, and }) => and(eq(workflow.public, true)),
    orderBy: (workflow, { desc }) => desc(workflow.updatedAt),
    limit: 20,
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
};
