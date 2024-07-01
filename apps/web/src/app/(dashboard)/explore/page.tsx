import Link from "next/link";

import { Button } from "@craftgen/ui/components/button";
import { ProjectList } from "@craftgen/ui/views/project-list";
import { WorkflowList } from "@craftgen/ui/views/workflow-list";

import { api } from "@/trpc/server";
import { createClient } from "@/utils/supabase/server";

const DashboardPage = async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const featuredWorkflows = await api.craft.module.featured({
    category: "all",
  });

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
              <ProjectList Link={Link} />
            </div>
          </>
        )}
        <div className="py-4">
          <WorkflowList workflows={featuredWorkflows} Link={Link} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
