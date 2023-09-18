import { db, user } from "@seocraft/supabase/db";

export const addToWaitlist = async (email: string) => {
  db.insert(user).values({
    id: ''
    email,
  });
};
