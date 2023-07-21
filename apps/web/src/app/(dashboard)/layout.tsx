import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@turboseo/supabase/db/database.types";
import { redirect } from "next/navigation";
import { Navbar } from "./navbar";

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
  return (
    <main>
      <Navbar session={session} />
      {children}
    </main>
  );
};

export default DashboardLayout;
