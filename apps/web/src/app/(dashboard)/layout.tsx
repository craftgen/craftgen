import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@seocraft/supabase/db/database.types";

import { persistGoogleToken } from "./actions";
import { Navbar } from "./navbar";

export const dynamic = "force-dynamic";
export const revalidate = 10;
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.provider_refresh_token && session?.provider_token) {
    await persistGoogleToken();
  }
  return (
    <main className="flex flex-col">
      <Navbar session={session!} />
      <div className="relative mt-12 flex-1">{children}</div>

    </main>
  );
};

export default DashboardLayout;
