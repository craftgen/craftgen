"use client";

import { createRoot } from "react-dom/client";
import { ReactPlugin, Presets } from "rete-react-plugin";

import { CustomNode } from "./ui/custom-node";
import { addCustomBackground } from "./ui/custom-background";
import { CustomSocket } from "./ui/custom-socket";
import { CustomConnection } from "./ui/custom-connection";
import { ReteStoreInstance } from "./store";
import { getControl } from "./control";

import { ResultOf, ResultOfAction } from "@/lib/type";
import { getWorkflow } from "@/actions/get-workflow";
import { Editor } from "@seocraft/core";
import { Schemes, WorkflowAPI, nodes } from "@seocraft/core/src/types";
import { updateNodeMetadata } from "@/actions/update-node-meta";
import { setContext } from "@/actions/update-context";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { AreaExtra } from "@seocraft/core/src/editor";
import { upsertNode } from "@/actions/upsert-node";
import { deleteNode } from "@/actions/delete-node";
import { saveEdge } from "@/actions/create-edge";
import { deleteEdge } from "@/actions/delete-edge";
import { updateExecutionNode } from "@/actions/update-execution-node";
import { createExecution } from "@/actions/create-execution";

export type ModuleMap = Record<string, ResultOf<typeof getWorkflow>>;

export const createEditorFunc = (params: {
  workflow: ResultOfAction<typeof getWorkflow>;
  store: ReteStoreInstance;
  api: Partial<WorkflowAPI>;
}) => {
  return (container: HTMLElement) => createEditor({ ...params, container });
};

export async function createEditor(params: {
  container: HTMLElement;
  workflow: ResultOfAction<typeof getWorkflow>;
  api: Partial<WorkflowAPI>;
  store: ReteStoreInstance;
}) {
  const contentNodes = params.workflow.versions[0].nodes.map((node) => ({
    id: node.id,
    type: node.type as any,
    projectId: node.projectId,
    workflowId: node.workflowId,
    workflowVersionId: node.workflowVersionId,
    contextId: node.contextId,
    context: node.context.state,
    state: node.nodeExectutions.map((ne) => ne.state)[0],
    nodeExecutionId: node.nodeExectutions.map((ne) => ne.id)[0],
    position: node.position,
    width: node.width,
    height: node.height,
    label: node.label,
    color: node.color,
  }));
  const contentEdges = params.workflow.versions[0].edges.map((edge) => ({
    sourceOutput: edge.sourceOutput,
    source: edge.source,
    targetInput: edge.targetInput,
    target: edge.target,
    workflowId: edge.workflowId,
    workflowVersionId: edge.workflowVersionId,
  }));

  console.log(contentNodes);

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
        workflowVersionId: params.workflow.versions[0].id,
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
      nodes: [...contentNodes],
      edges: [...contentEdges],
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
          return (data) => CustomSocket({ data: payload as any, meta }) as any;
        },
        connection(context) {
          return CustomConnection;
        },
        control(data) {
          return getControl(data);
        },
      },
    })
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
