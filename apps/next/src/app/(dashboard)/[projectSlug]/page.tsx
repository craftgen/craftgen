import { Metadata, ResolvingMetadata } from "next";
// import { ProjectNavbar } from "./project-navbar";
import { notFound, redirect } from "next/navigation";
import { getTRPCErrorFromUnknown } from "@trpc/server";

import { db } from "@craftgen/db/db";
import { ProjectLayout } from "@craftgen/ui/layout/project";
import { ProjectCard } from "@craftgen/ui/views/project-card";

import { api } from "@/trpc/server";

// import { getAnalytics } from "./actions";
// import { Metrics } from "./metrics";
import { PlaygroundList } from "./playground-list";
import { ProjectNavbar } from "./project-navbar";

export const dynamicParams = true;
export const revalidate = 300;

interface Props {
  params: {
    projectSlug: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

// export async function generateMetadata(
//   { params }: Props,
//   parent: ResolvingMetadata,
// ): Promise<Metadata> {
//   try {
//     const project = await api.project.bySlug({
//       projectSlug: params.projectSlug,
//     });

//     return {
//       title: `AI Agents by ${project?.name}`,
//       // description: `${project?.name}`,
//     };
//   } catch (e) {
//     console.log("ERROR", e);
//     return {
//       title: `AI Agents by ${params.projectSlug}`,
//       // description: `${project?.name}`,
//     };
//   }
// }

// export async function generateStaticParams() {
//   const projects = await db.query.project.findMany({
//     columns: {
//       slug: true,
//     },
//     limit: 10,
//   });

//   return projects.map((project) => ({
//     projectSlug: project.slug,
//   }));
// }

const ProjectPage = async ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  try {
    const org = await api.platform.orgs.bySlug({
      orgSlug: params.projectSlug,
    });

    if (!org) {
      notFound();
    }

    const playgroundList = await api.platform.craft.module.list({
      orgSlug: params.projectSlug,
    });

    return (
      <ProjectLayout>
        <ProjectLayout.Content>
          {/* <ProjectNavbar /> */}
          <div className="col-span-3 ">
            <ProjectCard project={org} />
          </div>

          <section className="col-span-9">
            <PlaygroundList
              orgSlug={params.projectSlug}
              playgroundList={playgroundList}
            />
          </section>
        </ProjectLayout.Content>
      </ProjectLayout>
    );
  } catch (e: unknown) {
    const error = getTRPCErrorFromUnknown(e);
    if (error.code === "NOT_FOUND") {
      notFound();
    } else if (error.code === "UNAUTHORIZED") {
      redirect(`/login?redirect=${params.projectSlug}`);
    }
  }
};

export default ProjectPage;
