import { createClient } from "@supabase/supabase-js";

import type { Database } from "@craftgen/db/db/database.types";

import { env } from "@/env.mjs";

export const getServiceSupabase = () =>
  createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
      },
    },
  );
