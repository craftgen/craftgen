import { NodeId } from "rete";
import { DiContainer, NodeProps, NodeTypes } from "./types";
import * as Nodes from "./nodes";
import { Connection } from "./connection/connection";
import { selectWorkflowNodeSchema } from "@seocraft/supabase/db";
import { z } from "zod";
import { createNode } from "@/actions/create-node";

type NodeWithState = z.infer<typeof selectWorkflowNodeSchema> & {
  context: {
    state?: any;
  };
};

export async function createNodeInstance({
  di,
  type,
  data,
  saveToDB = false,
  workflowId,
  projectSlug,
}: {
  di: DiContainer;
  type: NodeTypes;
  data: NodeWithState;
  saveToDB?: boolean;
  workflowId?: string;
  projectSlug?: string;
}) {
  type NodeMappingFunctions = {
    [Property in NodeTypes]: (di: DiContainer, data: any) => NodeProps;
  };

  const nodes: NodeMappingFunctions = {
    Start: (di, data) => new Nodes.Start(di, data),
    Log: (di, data) => new Nodes.Log(di, data),
    TextNode: (di, data) => new Nodes.TextNode(di, data),
    Number: (di, data) => new Nodes.Number(di, data),
    PromptTemplate: (di, data) => new Nodes.PromptTemplate(di, data),
    OpenAIFunctionCall: (di, data) => new Nodes.OpenAIFunctionCall(di, data),
    Replicate: (di, data) => new Nodes.Replicate(di, data),

    ComposeObject: (di, data) => new Nodes.ComposeObject(di, data),

    Article: (di, data) => new Nodes.Article(di, data),

    InputNode: (di, data) => new Nodes.InputNode(di, data),
    OutputNode: (di, data) => new Nodes.OutputNode(di, data),

    ModuleNode: (di, data) => new Nodes.ModuleNode(di, data),
    GoogleSheet: (di, data) => new Nodes.GoogleSheet(di, data),
    Wordpress: (di, data) => new Nodes.Wordpress(di, data),
    Webflow: (di, data) => new Nodes.Webflow(di, data),
    Shopify: (di, data) => new Nodes.Shopify(di, data),
    Postgres: (di, data) => new Nodes.Postgres(di, data),
  };
  const matched = nodes[type];

  if (!matched) throw new Error(`Unsupported node '${type}'`);

  if (saveToDB) {
    console.log("CREATING BRAND NEW NODE", data);
    if (!workflowId) throw new Error("playgroundId is required");
    if (!projectSlug) throw new Error("projectSlug is required");
    if (!data.workflowVersionId)
      throw new Error("workflowVersionId is required");
    const { data: workflowNodeInDB } = await createNode({
      workflowId,
      workflowVersionId: data.workflowVersionId,
      projectSlug,
      type,
      height: data.width,
      width: data.height,
      context: data.context?.state,
    });
    if (!workflowNodeInDB) throw new Error("Failed to create node in DB");
    console.log("creating new node with", { data, nodeInDb: workflowNodeInDB });

    const node = await matched(di, {
      ...workflowNodeInDB,
    });
    return node;
  }

  const node = await matched(di, data);
  return node;
}

export type Data = {
  nodes: NodeWithState[];
  edges: {
    id: NodeId;
    source: string;
    target: string;
    sourceOutput: keyof NodeProps["outputs"];
    targetInput: keyof NodeProps["inputs"];
  }[];
};

export async function importEditor(di: DiContainer, data: Data) {
  const { nodes, edges } = data;

  console.log(nodes);
  for (const n of nodes) {
    if (di.editor.getNode(n.id)) continue;
    const node = await createNodeInstance({
      di,
      type: n.type as any,
      data: {
        ...n,
      },
    });
    await di.editor.addNode(node);
    // if (di.area) { // TODO
    //   di.area.translate(node.id, n.position);
    // }
  }
  for (const c of edges) {
    const source = di.editor.getNode(c.source);
    const target = di.editor.getNode(c.target);

    if (
      source &&
      target &&
      source.outputs[c.sourceOutput] &&
      target.inputs[c.targetInput]
    ) {
      const conn = new Connection(
        source,
        c.sourceOutput,
        target,
        c.targetInput
      );

      await di.editor.addConnection(conn);
    }
  }
}
