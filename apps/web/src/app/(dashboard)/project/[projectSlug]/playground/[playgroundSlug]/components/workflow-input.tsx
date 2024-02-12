"use client";

import { api } from "@/trpc/react";
import { InputForm } from "./input-form";

export const WorkflowInput: React.FC<{
  projectSlug: string;
  workflowSlug: string;
  version: number;
}> = ({ projectSlug, workflowSlug, version }) => {
  const { data: nodes } = api.craft.module.io.useQuery({
    projectSlug: projectSlug,
    workflowSlug: workflowSlug,
    version: version!,
  });

  return (
    <section className="grid grid-cols-2 divide-x ">
      <div className="p-2">
        <h2 className="text-3xl font-bold">Input</h2>
        <div className="pt-4">
          <InputForm fields={nodes?.inputs} />
        </div>
      </div>
      <div className="p-2">
        <h2 className="text-3xl font-bold">Output</h2>
        <div className="space-y-2 pt-4">
          <InputForm fields={nodes?.outputs} />
        </div>
      </div>
    </section>
  );
};
