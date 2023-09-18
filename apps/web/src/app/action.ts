"use server";

import { db, waitlist } from "@seocraft/supabase/db";
import { ca } from "date-fns/locale";

export const addToWaitlist = async (params: {
  email: string;
  platforms?: string[];
}) => {
  return await db
    .insert(waitlist)
    .values({
      email: params.email,
      platforms: params.platforms || [],
    })
    .onConflictDoNothing()
    .returning();
};
