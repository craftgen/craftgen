import { NodeId } from "rete";
import { NodeProps, NodeTypes, nodesMeta } from "./types";
import * as Nodes from "./nodes";
import { DiContainer } from "./editor";
import { Connection } from "./connection/connection";
import { createNodeInDB } from "../action";
import { selectPlaygroundNodeSchema } from "@seocraft/supabase/db";
import { z } from "zod";

type NodeWithState = z.infer<typeof selectPlaygroundNodeSchema> & {
  node: {
    state?: any;
  };
};

export async function createNode({
  di,
  type,
  data,
  saveToDB = false,
  playgroundId,
  projectSlug,
}: {
  di: DiContainer;
  type: NodeTypes;
  data: NodeWithState;
  saveToDB?: boolean;
  playgroundId?: string;
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
    DataSource: (di, data) => new Nodes.DataSource(di, data),

    ComposeObject: (di, data) => new Nodes.ComposeObject(di, data),

    Article: (di, data) => new Nodes.Article(di, data),

    Input: (di, data) => new Nodes.Input(di, data),
    Output: (di, data) => new Nodes.Output(di, data),

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
    if (!playgroundId) throw new Error("playgroundId is required");
    if (!projectSlug) throw new Error("projectSlug is required");
    const nodeInDb = await createNodeInDB({
      playgroundId,
      projectSlug,
      type,
    });
    console.log("creating new node with", { data, nodeInDb });
    const node = await matched(di, {
      ...data,
      id: nodeInDb.id, // TODO: this need to be playgroundNode.id
      type: nodeInDb.type,
      project_id: nodeInDb.project_id,
      label: nodesMeta[type].name,
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

  for (const n of nodes) {
    if (di.editor.getNode(n.id)) continue;
    // const nodeData = await getNodeData(n.node_id);
    // if (!nodeData) throw new Error(`Node data not found for ${n.node_id}`);

    const node = await createNode({
      di,
      type: n.type as any,
      data: {
        ...n,
      },
    });
    await di.editor.addNode(node);
    if (di.area) {
      di.area.translate(node.id, n.position);
    }
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
