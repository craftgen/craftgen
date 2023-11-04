import { type Database } from "@seocraft/supabase/db/database.types";
import { createClient } from "@supabase/supabase-js";

export const getServiceSupabase = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        persistSession: false,
      },
    },
  );
