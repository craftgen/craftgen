"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { db, user } from "@turboseo/supabase/db";
import { cookies } from "next/headers";

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
};
