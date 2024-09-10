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
