"use client";

import { ReactNode } from "react";

import { Editor } from "@seocraft/core";
import type { AreaExtra } from "@seocraft/core/src/editor";
import {
  Actions,
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
  componentRegistry: Actions<HTMLElement, ReactNode>;
}) => {
  return (container: HTMLElement) => createEditor({ ...params, container });
};

export async function createEditor(params: {
  container: HTMLElement;
  workflow: RouterOutputs["craft"]["module"]["get"];
  api: Partial<WorkflowAPI>;
  store: ReteStoreInstance;
  componentRegistry: Actions<HTMLElement, ReactNode>;
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
  });
  await di.setup();
  addCustomBackground(di?.area!);
  params.store.getState().setDi(di);
  return di;
}
