"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import { Editor } from "@seocraft/core";
import type { AreaExtra } from "@seocraft/core/src/editor";
import {
  Registry,
  Presets,
  ReactPlugin,
} from "@seocraft/core/src/plugins/reactPlugin";
import type { Schemes, WorkflowAPI } from "@seocraft/core/src/types";
import { nodes } from "@seocraft/core/src/types";

import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import type { RouterOutputs } from "@/trpc/shared";

import { getControl } from "./control";
import type { ReteStoreInstance } from "./store";
import { addCustomBackground } from "./ui/custom-background";
import { CustomConnection } from "./ui/custom-connection";
import { CustomNode } from "./ui/custom-node";
import { CustomSocket } from "./ui/custom-socket";

export const createEditorFunc = (params: {
  workflow: RouterOutputs["craft"]["module"]["get"];
  store: ReteStoreInstance;
  api: Partial<WorkflowAPI>;
  componentRegistry: Registry<
    HTMLElement,
    {
      element: HTMLElement;
      component: ReactNode;
    }
  >;
}) => {
  return (container: HTMLElement) => createEditor({ ...params, container });
};

export const useHeadlessEditor = (params: {
  workflow: RouterOutputs["craft"]["module"]["get"];
  api: Partial<WorkflowAPI>;
  store: ReteStoreInstance;
}) => {
  const ref = useRef<Editor | null>(null);
  const [isInitialized, setInitialized] = useState(false);

  useEffect(() => {
    const initEditor = async () => {
      if (!ref.current) {
        // Check if the editor has not been initialized already.
        ref.current = await createHeadlessEditor(params);
        setInitialized(true); // Update state to indicate the editor is initialized.
      }
    };

    initEditor();
  }, []);
  return {
    editor: ref.current,
    isInitialized,
  };
};

export async function createHeadlessEditor(params: {
  workflow: RouterOutputs["craft"]["module"]["get"];
  api: Partial<WorkflowAPI>;
  store: ReteStoreInstance;
}) {
  const di = new Editor({
    config: {
      nodes,
      meta: {
        projectId: params.workflow.projectId,
        workflowId: params.workflow.id,
        workflowVersionId: params.workflow.version.id,
        executionId: params.workflow?.execution?.id,
      },
      api: {
        trpc: params.api.trpc!,
      },
      readonly: true,
    },
    content: {
      context: params.workflow.context,
      nodes: params.workflow.nodes,
      edges: params.workflow.edges,
      contexts: params.workflow.contexts,
    },
  });

  await di.setup();
  params.store.getState().setDi(di);
  return di;
}

export async function createEditor(params: {
  container: HTMLElement;
  workflow: RouterOutputs["craft"]["module"]["get"];
  api: Partial<WorkflowAPI>;
  store: ReteStoreInstance;
  componentRegistry: Registry<
    HTMLElement,
    {
      element: HTMLElement;
      component: ReactNode;
    }
  >;
}) {
  console.log("BEFORE", params.workflow);
  const di = new Editor({
    config: {
      nodes,
      on: {
        incompatibleConnection({ source, target }) {
          console.log("incompatibleConnection", { source, target });
          // TODO fix this.
          toast({
            title: "Sockets are not compatible",
            description: (
              <span>
                Socket <Badge> {source.name} </Badge> is not compatible with{" "}
                <Badge>{target.name} </Badge>
              </span>
            ),
          });
        },
      },
      meta: {
        projectId: params.workflow.projectId,
        workflowId: params.workflow.id,
        workflowVersionId: params.workflow.version.id,
        executionId: params.workflow?.execution?.id,
      },
      api: {
        trpc: params.api.trpc!,
      },
    },
    content: {
      context: params.workflow?.execution || params.workflow.context,
      nodes: params.workflow.nodes,
      edges: params.workflow.edges,
      contexts: params.workflow.contexts,
    },
  });

  const render = new ReactPlugin<Schemes, AreaExtra<Schemes>>({
    createPortal: params.componentRegistry,
  });
  render.addPreset(
    Presets.classic.setup({
      customize: {
        node(context) {
          // TODO: fix types some point
          return ({ data, emit }: any) =>
            CustomNode({ data, emit, store: params.store }) as any;
        },
        socket(context) {
          const { payload, ...meta } = context;
          return (data) => CustomSocket({ data: payload, meta }) as any;
        },
        connection(context) {
          const { payload, ...meta } = context;
          return (data) =>
            CustomConnection({ data: payload, di, ...meta }) as any;
        },
        control(data) {
          return getControl(data);
        },
      },
    }),
  );

  await di.mount({
    container: params.container,
    render: render as any,
    domRegistry: params.componentRegistry,
  });
  await di.setup();
  addCustomBackground(di?.area!);
  params.store.getState().setDi(di);
  return di;
}
