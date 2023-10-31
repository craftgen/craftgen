import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@seocraft/supabase/db/database.types";
import { Navbar } from "./navbar";
import { persistGoogleToken } from "./actions";
import { Toaster } from "@/components/ui/toaster";

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
      <div className="relative flex-1 mt-12">{children}</div>
      {/* <CommandMenu /> */}
      <Toaster />
    </main>
  );
};

export default DashboardLayout;
