import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProjectList } from "./project-list";
import { WorkflowList } from "@/components/template-list";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getFeaturedWorkflows } from "./actions";

const DashboardPage = async () => {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const featuredWorkflows = await getFeaturedWorkflows();

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
          <WorkflowList workflows={featuredWorkflows} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
