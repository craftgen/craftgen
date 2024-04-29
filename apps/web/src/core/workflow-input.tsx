"use client";

import { api } from "@/trpc/react";
import { RouterOutputs } from "@seocraft/api";
import { useEffect, useRef } from "react";
import { useHeadlessEditor } from "@/core/editor";
import { createCraftStore } from "@/core/store";
import { CraftContext } from "@/core/use-store";
import { InputsList, OutputList } from "@/core/ui/control/control-node";

export const WorkflowInput: React.FC<{
  projectSlug: string;
  workflowSlug: string;
  version: number;
}> = ({ projectSlug, workflowSlug, version }) => {
  const { data: workflow, isLoading } = api.craft.module.get.useQuery(
    {
      projectSlug: projectSlug,
      workflowSlug: workflowSlug,
      version: version!,
    },
    {
      refetchOnWindowFocus: false,
    },
  );
  if (isLoading) return <div>Loading...</div>;
  if (!workflow) return <div>Not found</div>;
  return <WorkflowSimple workflow={workflow} />;
};

export const WorkflowSimple = (props: {
  workflow: RouterOutputs["craft"]["module"]["get"];
}) => {
  const store = useRef(
    createCraftStore({
      layout: null as any,
      theme: "dark",
      readonly: false,
      projectId: props.workflow.project.id,
      projectSlug: props.workflow.projectSlug,
      workflowId: props.workflow.id,
      workflowSlug: props.workflow.slug,
      workflowVersionId: props.workflow.version?.id,
    }),
  );
  const utils = api.useUtils();
  const { editor } = useHeadlessEditor({
    workflow: props.workflow,
    api: {
      trpc: utils.client,
    },
    store: store.current,
  });
  useEffect(() => {
    (window as any).Editor = editor;
  }, [editor]);
  if (!editor) return <div>Loading...</div>;
  console.log(editor);
  return (
    <CraftContext.Provider value={store?.current}>
      <div className="grid grid-cols-2 gap-4">
        {editor.actor && <InputsList actor={editor.actor} />}
        {editor.actor && <OutputList actor={editor.actor} />}
      </div>
    </CraftContext.Provider>
  );
};
