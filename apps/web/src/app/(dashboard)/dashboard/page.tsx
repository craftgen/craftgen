import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProjectList } from "./project-list";
import { TemplateList } from "@/components/template-list";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const DashboardPage = async () => {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col w-full items-center">
      <div className="w-full max-w-5xl p-4">
        {user && (
          <>
            <div className="flex justify-between items-center ">
              <h2>Projects</h2>
              <Link href="/project/new">
                <Button>Create New Project.</Button>
              </Link>
            </div>
            <div className="py-4">
              <ProjectList />
            </div>
          </>
        )}
        <div className="py-4">
          <TemplateList />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
