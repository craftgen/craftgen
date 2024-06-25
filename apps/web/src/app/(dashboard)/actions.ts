"use server";

import { db, user } from "@craftgen/db/db";

import { createClient } from "@/utils/supabase/server";

export const persistGoogleToken = async () => {
  const supabase = createClient();
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
