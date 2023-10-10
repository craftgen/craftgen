import type { Metadata, ResolvingMetadata } from "next";

import {
  getWorkflow,
  getWorkflowInputOutput,
  getWorkflowMeta,
} from "../action";
import { InputForm } from "./components/input-form";
import { useMemo } from "react";

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
  const { data: playground } = await getWorkflowMeta({
    projectSlug: params.projectSlug,
    workflowSlug: params.playgroundSlug,
  });

  return {
    title: `${playground?.name} | ${playground?.project.name}`,
  };
}

const PlaygroundPage: React.FC<Props> = async (props) => {
  const { data: workflow } = await getWorkflowMeta({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
  });
  if (!workflow) return <div>Not found</div>;
  const { data } = await getWorkflowInputOutput({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
    version: workflow.version?.version!,
  });
  // const output = data?.outputs?[0].context?.state?.outputs;
  const output = () => {
    if (data?.outputs && data?.outputs[0]!) {
      return data?.outputs[0].context?.state?.outputs;
    }
    return undefined;
  };
  const input = () => {
    if (data?.inputs && data?.inputs[0]!) {
      return data?.inputs[0].context?.state;
    }
    return undefined;
  };
  return (
    <div className="h-full flex flex-col">
      <section className="grid grid-cols-2 divide-x ">
        <div className="p-2">
          <h2 className="text-3xl font-bold">Input</h2>
          <div className="pt-4">
            {input() && (
              <InputForm workflow={workflow} input={input() as any} />
            )}
          </div>
        </div>
        <div className="p-2">
          <h2 className="text-3xl font-bold">Output</h2>
          <div className="space-y-2 pt-4">
            {output() &&
              Object.keys(output()).map((o: any) => (
                <div key={o} className="space-y-2">
                  <div className="font-bold">{o}</div>
                  <div className="bg-muted/40 p-2 rounded">{output()[o]}</div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlaygroundPage;
