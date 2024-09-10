import type { Metadata, ResolvingMetadata } from "next";

import { api } from "@/trpc/server";

interface Props {
  params: {
    projectSlug: string;
    workflowSlug: string;
    version: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const workflow = await api.craft.module.meta({
    projectSlug: params.projectSlug,
    workflowSlug: params.workflowSlug,
  });

  return {
    title: `${workflow?.name} | ${workflow?.project.name}`,
  };
}

const PlaygroundVersionsPage: React.FC<Props> = async (props) => {
  const workflow = await api.craft.module.meta({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.workflowSlug,
  });
  if (!workflow) return <div>Not found</div>;
  return (
    <div className="flex h-full flex-col">
      <section className="flex flex-col divide-y">
        <h1 className="text-2xl">Version {workflow.version?.version}</h1>
        <p>{workflow.version?.changeLog}</p>
      </section>
    </div>
  );
};

export default PlaygroundVersionsPage;
