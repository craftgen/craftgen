"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { db } from "@seocraft/supabase/db";
import { cookies } from "next/headers";

export const getProjects = async () => {
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
