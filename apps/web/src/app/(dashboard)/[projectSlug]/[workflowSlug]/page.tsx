import type { Metadata, ResolvingMetadata } from "next";

import { api } from "@/trpc/server";
import { WorkflowInput } from "./components/workflow-input";
import { db } from "@seocraft/supabase/db";

export const dynamicParams = true;

interface Props {
  params: {
    projectSlug: string;
    workflowSlug: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const workflowMeta = await api.craft.module.meta({
    projectSlug: params.projectSlug,
    workflowSlug: params.workflowSlug,
  });

  return {
    title: `${workflowMeta?.name} | ${workflowMeta?.project.name}`,
  };
}

export async function generateStaticParams() {
  const projects = await db.query.project.findMany({
    columns: {
      slug: true,
    },
    with: {
      workflows: {
        columns: {
          slug: true,
        },
      },
    },
  });
  const paths = projects
    ?.map((project) => {
      return project.workflows.map((workflow) => ({
        projectSlug: project.slug,
        workflowSlug: workflow.slug,
      }));
    })
    .flat();
  console.log(paths);
  return paths;
}

const PlaygroundPage: React.FC<Props> = async (props) => {
  const workflowMeta = await api.craft.module.meta({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.workflowSlug,
  });
  if (!workflowMeta) return <div>Not found</div>;
  return (
    <div className="flex h-full flex-col">
      <WorkflowInput
        projectSlug={workflowMeta.projectSlug}
        workflowSlug={workflowMeta.slug}
        version={workflowMeta.version?.version!}
      />
    </div>
  );
};

export default PlaygroundPage;
