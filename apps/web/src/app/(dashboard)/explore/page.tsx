import { cookies } from "next/headers";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Button } from "@craftgen/ui/components/button";

import { WorkflowList } from "@/components/template-list";

import { getFeaturedWorkflows } from "./actions";
import { ProjectList } from "./project-list";

const DashboardPage = async () => {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const featuredWorkflows = await getFeaturedWorkflows();

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-5xl p-4">
        {user && (
          <>
            <div className="flex items-center justify-between ">
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
