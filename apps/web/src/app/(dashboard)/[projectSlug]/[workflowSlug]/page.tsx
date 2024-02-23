import type { Metadata, ResolvingMetadata } from "next";

import { api } from "@/trpc/server";

import { InputForm } from "./components/input-form";
import { WorkflowInput } from "./components/workflow-input";

interface Props {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const workflowMeta = await api.craft.module.meta.query({
    projectSlug: params.projectSlug,
    workflowSlug: params.workflowSlug,
  });

  return {
    title: `${workflowMeta?.name} | ${workflowMeta?.project.name}`,
  };
}

const PlaygroundPage: React.FC<Props> = async (props) => {
  const workflowMeta = await api.craft.module.meta.query({
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
