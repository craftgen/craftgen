"use client";

import { api } from "@/trpc/react";
import { InputForm } from "./input-form";
import { setup, assign } from "xstate";
import { useMachine, useSelector } from "@xstate/react";
import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import { RouterOutputs } from "@seocraft/api";
import {
  getControlBySocket,
  getSocketByJsonSchemaType,
} from "@seocraft/core/src/sockets";
import { getControl } from "@/core/control";
import { useRef } from "react";
import { createHeadlessEditor, useHeadlessEditor } from "@/core/editor";
import { InspectorNode } from "@/app/(playground)/[projectSlug]/[workflowSlug]/v/[version]/playground";
import { createCraftStore } from "@/core/store";
import { CraftContext } from "@/core/use-store";

const inputMachine = setup({
  types: {
    input: {} as {
      inputs: Record<string, string>;
      inputSockets: Record<string, JSONSocket>;
      outputSockets: Record<string, JSONSocket>;
      outputs: Record<string, string>;
    },
    context: {} as {
      inputs: Record<string, any>;
      inputSockets: Record<string, JSONSocket>;
      outputSockets: Record<string, JSONSocket>;
      outputs: Record<string, any>;
    },
  },
  actions: {
    setValue: assign({
      inputs: ({ context, event }, params: { values: Record<string, any> }) => {
        const values = event.params?.values || params?.values;
        Object.keys(context.inputs).forEach((key) => {
          if (!context.inputSockets[key]) {
            delete context.inputs[key];
          }
        });
        Object.keys(values).forEach((key) => {
          if (!context.inputSockets[key]) {
            delete values[key];
          }
        });

        return {
          ...context.inputs,
          ...values,
        };
      },
    }),
  },
}).createMachine({
  id: "input",
  context: ({ input }) => {
    const defaultInputs: (typeof input)["inputs"] = {};
    for (const [key, socket] of Object.entries(input.inputSockets)) {
      if (socket.default) {
        defaultInputs[key as any] = socket.default;
      } else {
        defaultInputs[key as any] = undefined;
      }
    }

    return {
      inputs: defaultInputs,
      inputSockets: input.inputSockets,
      outputSockets: input.outputSockets,
      outputs: input.outputs,
    };
  },
  initial: "idle",
  on: {
    SET_VALUE: {
      actions: "setValue",
    },
  },
  states: {
    idle: {
      on: {
        SUBMIT: "submitting",
      },
    },
    submitting: {
      invoke: {
        src: "submit",
        onDone: "success",
        onError: "error",
      },
    },
    success: {
      type: "final",
    },
    error: {
      on: {
        SUBMIT: "submitting",
      },
    },
  },
});

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
  console.log(workflow, isLoading);
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
  console.log(editor);
  if (!editor) return <div>Loading...</div>;
  return (
    <CraftContext.Provider value={store?.current}>
      <InspectorNode node={editor?.editor.getNodes()[0]} />
    </CraftContext.Provider>
  );
};
