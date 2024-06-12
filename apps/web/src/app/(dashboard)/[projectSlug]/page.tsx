import { Metadata, ResolvingMetadata } from "next";
// import { ProjectNavbar } from "./project-navbar";
import { notFound } from "next/navigation";

import { db } from "@craftgen/db/db";
import { ProjectLayout } from "@craftgen/ui/layout/project";
import { ProjectCard } from "@craftgen/ui/views/project-card";

import { api } from "@/trpc/server";

// import { getAnalytics } from "./actions";
// import { Metrics } from "./metrics";
import { PlaygroundList } from "./playground-list";

// import { Onboarding } from "@/components/onboarding";

export const dynamicParams = true;
export const revalidate = 300;

interface Props {
  params: {
    projectSlug: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const project = await api.project.bySlug({
    projectSlug: params.projectSlug,
  });

  return {
    title: `AI Agents by ${project?.name}`,
    // description: `${project?.name}`,
  };
}

export async function generateStaticParams() {
  const projects = await db.query.project.findMany({
    columns: {
      slug: true,
    },
    limit: 10,
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
    <ProjectLayout>
      <ProjectLayout.Content>
        <div className="col-span-3 ">
          <ProjectCard project={project} />
        </div>

        <section className="col-span-9">
          <PlaygroundList projectSlug={params.projectSlug} />
        </section>
      </ProjectLayout.Content>
    </ProjectLayout>
  );
};

export default ProjectPage;
