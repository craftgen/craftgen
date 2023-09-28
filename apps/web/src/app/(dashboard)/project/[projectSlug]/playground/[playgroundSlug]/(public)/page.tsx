import type { Metadata, ResolvingMetadata } from "next";

import { getWorkflow } from "../action";

type Props = {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { data: playground } = await getWorkflow({
    projectSlug: params.projectSlug,
    workflowSlug: params.playgroundSlug,
  });

  return {
    title: `${playground?.name} | ${playground?.project.name}`,
  };
}

const PlaygroundPage: React.FC<Props> = async (props) => {
  // TODO: make amount we fetch configurable
  const { data: playground } = await getWorkflow({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
  });
  if (!playground) return <div>Not found</div>;
  return (
    <div className="h-full flex flex-col">
      <section className="grid grid-cols-2 divide-x ">
        <div className="p-2">
          <h2>Input</h2>
        </div>
        <div className="p-2">
          <h2>Output</h2>
        </div>
      </section>
    </div>
  );
};

export default PlaygroundPage;
