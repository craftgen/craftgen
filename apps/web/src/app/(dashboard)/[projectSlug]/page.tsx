import { api } from "@/trpc/server";
import { getAnalytics } from "./actions";
import { Metrics } from "./metrics";
import { PlaygroundList } from "./playground-list";
import { ProjectNavbar } from "./project-navbar";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { db } from "@seocraft/supabase/db";
import { Onboarding } from "@/components/onboarding";

export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  const projects = await db.query.project.findMany({
    columns: {
      slug: true,
    },
  });

  return projects.map((project) => ({
    projectSlug: project.slug,
  }));
}

const ProjectPage = async ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  const project = await api.project.bySlug({
    projectSlug: params.projectSlug,
  });
  if (!project) {
    notFound();
  }
  // const metrics = project?.site
  //   ? await getAnalytics({ siteUrl: project?.site })
  //   : undefined;
  return (
    <div className="flex flex-col items-center p-10">
      {/* {metrics && <Metrics metrics={metrics} />} */}
      <div className="grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-12">
        <div className="col-span-3 ">
          <Card className="space-y-2 rounded-lg p-4">
            <div className="flex w-full items-center justify-center">
              <Avatar className="h-40 w-40">
                {project?.avatar_url && (
                  <AvatarImage src={project.avatar_url} />
                )}
                <AvatarFallback>
                  {project.slug[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <h1 className="font-mono text-xl font-bold leading-tight">
              {project?.name}
            </h1>
            <h2 className="text-muted-foreground text-lg leading-tight">
              {project?.slug}
            </h2>
          </Card>
        </div>

        <section className="col-span-9">
          <PlaygroundList projectId={project?.id!} />
        </section>
      </div>
      {/* <Onboarding /> */}
    </div>
  );
};

export default ProjectPage;
