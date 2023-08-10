import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@seocraft/supabase/db/database.types";
import { redirect } from "next/navigation";
import { Navbar } from "./navbar";
import { persistGoogleToken } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 10;

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/");
  }
  if (session.provider_refresh_token && session.provider_token) {
    await persistGoogleToken();
  }
  return (
    <main>
      <Navbar session={session} />
      <div className="px-4">{children}</div>
    </main>
  );
};

export default DashboardLayout;
