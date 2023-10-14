import { getWorkflowMeta } from "@/actions/get-workflow-meta";
import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: {
    projectSlug: string;
    playgroundSlug: string;
    version: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { data: playground } = await getWorkflowMeta({
    projectSlug: params.projectSlug,
    workflowSlug: params.playgroundSlug,
  });

  return {
    title: `${playground?.name} | ${playground?.project.name}`,
  };
}

const PlaygroundVersionsPage: React.FC<Props> = async (props) => {
  // TODO: make amount we fetch configurable
  const { data: workflow } = await getWorkflowMeta({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
    version: Number(props.params.version),
  });
  if (!workflow) return <div>Not found</div>;
  return (
    <div className="h-full flex flex-col">
      <section className="flex flex-col divide-y">
        <h1 className="text-2xl">Version {workflow.version?.version}</h1>
        <p>{workflow.version?.changeLog}</p>
      </section>
    </div>
  );
};

export default PlaygroundVersionsPage;
