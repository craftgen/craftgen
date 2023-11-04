"use client";

import { createRoot } from "react-dom/client";
import { Presets, ReactPlugin } from "rete-react-plugin";

import { Editor } from "@seocraft/core";
import type { AreaExtra } from "@seocraft/core/src/editor";
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
}) => {
  return (container: HTMLElement) => createEditor({ ...params, container });
};

export async function createEditor(params: {
  container: HTMLElement;
  workflow: RouterOutputs["craft"]["module"]["get"];
  api: Partial<WorkflowAPI>;
  store: ReteStoreInstance;
}) {
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
        async checkAPIKeyExist(params) {
          return true;
        },
        async getAPIKey(params) {
          return "";
        },
        async triggerWorkflowExecutionStep(params) {},
        createExecution: params.api.createExecution!,
        updateNodeMetadata: params.api.updateNodeMetadata!,
        upsertNode: params.api.upsertNode!,
        deleteNode: params.api.deleteNode!,
        saveEdge: params.api.saveEdge!,
        deleteEdge: params.api.deleteEdge!,
        setState: params.api.setState!,
        setContext: params.api.setContext!,
        getModule: params.api.getModule!,
        async getModulesMeta(params) {
          return [
            {
              name: "test",
              version: "1.0.0",
              description: "test",
              id: "test",
            },
          ];
        },
      },
    },
    content: {
      nodes: params.workflow.nodes,
      edges: params.workflow.edges,
    },
  });

  const render = new ReactPlugin<Schemes, AreaExtra<Schemes>>({
    createRoot: (container) =>
      createRoot(container, {
        identifierPrefix: "rete-",
      }),
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
          return (data) => CustomSocket({ data: payload , meta }) as any;
        },
        connection(context) {
          return CustomConnection;
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
  console.log(di);
  addCustomBackground(di?.area!);
  params.store.getState().setDi(di);
  return di;
}
