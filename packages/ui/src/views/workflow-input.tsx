"use client";

import { useCallback, useEffect } from "react";

// import { useSearchParams } from "next/navigation";
// import { isNil } from "lodash-es";

import { RouterOutputs } from "@craftgen/api";

// import { useHeadlessEditor } from "@craftgen/composer/editor";
// import { InputsList, OutputList } from "@/core/ui/control/control-node";
import { api } from "../lib/api";

export const WorkflowInput: React.FC<{
  projectSlug: string;
  workflowSlug: string;
  version: number;
  executionId: string;
}> = ({ projectSlug, workflowSlug, version, executionId }) => {
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
  console.log({
    projectSlug,
    workflowSlug,
    version,
    executionId,
  });
  if (isLoading) return <div>Loading...</div>;
  if (!workflow) return <div>Not found</div>;
  return <WorkflowSimple workflow={workflow} />;
};

export const WorkflowSimple = (props: {
  workflow: RouterOutputs["craft"]["module"]["get"];
}) => {
  // const store = useRef(
  //   createCraftStore({
  //     layout: null as any,
  //     theme: "dark",
  //     readonly: false,
  //     projectId: props.workflow.project.id,
  //     projectSlug: props.workflow.projectSlug,
  //     workflowId: props.workflow.id,
  //     workflowSlug: props.workflow.slug,
  //     workflowVersionId: props.workflow.version?.id,
  //   }),
  // );
  const utils = api.useUtils();
  // const { editor } = useHeadlessEditor({
  //   workflow: props.workflow,
  //   api: {
  //     trpc: utils.client,
  //   },
  // });
  // const searchParams = useSearchParams();
  // useEffect(() => {
  //   (window as any).Editor = editor;
  // }, [editor]);

  // const createQueryString = useCallback(
  //   (name: string, value: string | null) => {
  //     const params = new URLSearchParams(searchParams.toString());
  //     if (value === null) {
  //       params.delete(name);
  //     } else {
  //       params.set(name, value);
  //     }

  //     return params.toString();
  //   },
  //   [searchParams],
  // );
  // useEffect(() => {
  //   if (editor?.executionId) {
  //     window.history.pushState(
  //       null,
  //       "",
  //       `?${createQueryString("execution", editor?.executionId)}`,
  //     );
  //   }
  // }, [editor?.executionId]);
  // useEffect(() => {
  //   if (
  //     (searchParams.get("execution") && isNil(props.workflow.execution)) ||
  //     editor?.executionId
  //   ) {
  //     console.error("Invalid execution id");
  //     window.history.pushState(
  //       null,
  //       "",
  //       `?${createQueryString("execution", null)}`,
  //     );
  //   }
  // }, [searchParams.get("execution")]);
  // if (!editor) return <div>Loading...</div>;

  return (
    // <CraftContext.Provider value={store?.current}>
    <div className="grid grid-cols-2 gap-4">
      {/* {editor.actor && <InputsList actor={editor.actor} />}
      {editor.actor && <OutputList actor={editor.actor} />} */}
    </div>
    // </CraftContext.Provider>
  );
};
