import { useEffect, useRef } from "react";

import { RouterOutputs } from "@craftgen/api";
import { api } from "@craftgen/ui/lib/api";

import { useHeadlessEditor } from "./editor";
import { createCraftStore } from "./store";
import { InputsList, OutputList } from "./ui/control/control-node";
import { CraftContext, useCraftStore } from "./use-store";

export const WorkflowInput = (props: {
  workflow: RouterOutputs["craft"]["module"]["get"];
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <WorkflowInputForm workflow={props.workflow} />
    </div>
  );
};

export const WorkflowInputForm = (props: {
  workflow: RouterOutputs["craft"]["module"]["get"];
}) => {
  const utils = api.useUtils();
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

  return (
    <CraftContext.Provider value={store.current}>
      {editor?.actor && <InputsList actor={editor.actor} />}
      {editor?.actor && <OutputList actor={editor.actor} />}
    </CraftContext.Provider>
  );
};
