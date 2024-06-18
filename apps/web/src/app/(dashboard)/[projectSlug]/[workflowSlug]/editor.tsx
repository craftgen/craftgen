"use client";

import { RouterOutputs } from "@craftgen/api";
import { useHeadlessEditor } from "@craftgen/composer/editor";
import {
  InputsList,
  OutputList,
} from "@craftgen/composer/ui/control/control-node";

import { api } from "@/trpc/react";

export const Editor = ({
  projectSlug,
  workflowSlug,
  version,
  executionId,
}: {
  projectSlug: string;
  workflowSlug: string;
  version: number;
  executionId: string;
}) => {
  const { data: workflow, isLoading } = api.craft.module.get.useQuery(
    {
      projectSlug: projectSlug,
      workflowSlug: workflowSlug,
      version: version!,
      executionId: executionId,
    },
    {
      refetchOnWindowFocus: false,
    },
  );
  return <div>{workflow && <WorkflowInput workflow={workflow} />}</div>;
};

export const WorkflowInput = (props: {
  workflow: RouterOutputs["craft"]["module"]["get"];
}) => {
  const utils = api.useUtils();
  const { editor } = useHeadlessEditor({
    workflow: props.workflow,
    api: {
      trpc: utils.client,
    },
  });
  console.log("EDITOR", editor);
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {editor?.actor && <InputsList actor={editor.actor} />}
        {editor?.actor && <OutputList actor={editor.actor} />}
      </div>
    </div>
  );
};
