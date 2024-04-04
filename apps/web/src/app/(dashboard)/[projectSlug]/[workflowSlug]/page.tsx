import type { Metadata, ResolvingMetadata } from "next";

import { api } from "@/trpc/server";
import { WorkflowInput } from "./components/workflow-input";
import { db } from "@seocraft/supabase/db";

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

export async function generateStaticParams({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) {
  const modules = await db.query.project.findFirst({
    where: (project, { eq }) => eq(project.slug, params.projectSlug),
    columns: {},
    with: {
      workflows: {
        columns: {
          slug: true,
        },
      },
    },
  });
  return modules?.workflows.map((module) => ({
    projectSlug: params.projectSlug,
    workflowSlug: module.slug,
  }));
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
