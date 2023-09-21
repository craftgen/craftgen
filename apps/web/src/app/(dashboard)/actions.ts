"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { db, user } from "@seocraft/supabase/db";
import { cookies } from "next/headers";

export const getUser = async () => {
  const supabase = createServerActionClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("User not found");
  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session?.user.id),
    columns: {
      email: true,
      fullName: true,
      username: true,
      avatar_url: true,
    },
  });
  return user;
};

export const persistGoogleToken = async () => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  if (
    session?.data.session?.provider_token &&
    session?.data.session?.provider_refresh_token
  ) {
    await db.update(user).set({
      google_access_token: session?.data.session.provider_token,
      google_refresh_token: session?.data.session.provider_refresh_token,
    });
  }
  const personalProject = await db.query.project.findFirst({
    where: (project, { eq, and }) => and(eq(project.personal, true)),
  });
};
