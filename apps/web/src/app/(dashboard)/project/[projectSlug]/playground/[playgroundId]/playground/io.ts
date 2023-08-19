import { NodeEditor, NodeId } from "rete";
import { NodeProps, NodeTypes, Schemes } from "./types";
import * as Nodes from "./nodes";
import { DiContainer } from "./editor";
import { Connection } from "./connection";
import { createNodeInDB, getNodeData } from "../action";

export async function createNode({
  di,
  name,
  data,
  saveToDB = false,
  playgroundId,
  projectSlug,
}: {
  di: DiContainer;
  name: NodeTypes;
  data: NonNullable<Awaited<ReturnType<typeof getNodeData>>>;
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
    PromptTemplate: (di, data) => new Nodes.PromptTemplate(di, data),
    OpenAIFunctionCall: (di, data) => new Nodes.OpenAIFunctionCall(di, data),
    DataSource: (di, data) => new Nodes.DataSource(di, data),

    DatabaseDelete: (di, data) => new Nodes.DatabaseDelete(di, data),
    DatabaseInsert: (di, data) => new Nodes.DatabaseInsert(di, data),
    DatabaseSelect: (di, data) => new Nodes.DatabaseSelect(di, data),
    DatabaseUpdate: (di, data) => new Nodes.DatabaseUpdate(di, data),
    DatabaseUpsert: (di, data) => new Nodes.DatabaseUpsert(di, data),

    ComposeObject: (di, data) => new Nodes.ComposeObject(di, data),
  };
  const matched = nodes[name];

  if (!matched) throw new Error(`Unsupported node '${name}'`);

  if (saveToDB) {
    if (!playgroundId) throw new Error("playgroundId is required");
    if (!projectSlug) throw new Error("projectSlug is required");
    const nodeInDb = await createNodeInDB({
      playgroundId,
      projectSlug,
      type: name,
    });
    console.log("creating new node with", { data, nodeInDb });
    const node = await matched(di, {
      ...nodeInDb,
    });
    return node;
  }

  const node = await matched(di, data);
  return node;
}

export type Data = {
  nodes: { id: NodeId; name: string; data: Record<string, unknown> }[];
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
    const nodeData = await getNodeData(n.id);
    if (!nodeData) throw new Error(`Node data not found for ${n.id}`);
    const node = await createNode({
      di,
      name: n.name as any,
      data: {
        ...nodeData,
      },
    });
    node.id = n.id;
    await di.editor.addNode(node);
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

export async function exportEditor(editor: NodeEditor<Schemes>) {
  const nodes = [];
  const edges = [];

  for (const n of editor.getNodes()) {
    nodes.push({
      id: n.id,
      name: n.constructor.name,
      data: await n.serialize(),
    });
  }
  for (const c of editor.getConnections()) {
    edges.push({
      source: c.source,
      sourceOutput: c.sourceOutput,
      target: c.target,
      targetInput: c.targetInput,
    });
  }

  return {
    nodes,
    edges,
  };
}
