"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

import { db } from "@seocraft/supabase/db";

export const getUserProjects = async () => {
  const supabase = createServerActionClient({ cookies });
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
    where: (workflow, { eq, and }) =>
      and(eq(workflow.featured, true), eq(workflow.public, true)),
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
