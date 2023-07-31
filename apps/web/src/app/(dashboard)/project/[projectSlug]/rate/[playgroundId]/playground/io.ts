import { ClassicPreset, NodeEditor, NodeId } from "rete";
import { NodeProps, Schemes } from "./types";
import { ActionSocket } from "./sockets";
import * as Nodes from "./nodes";
import { DiContainer } from "./editor";
import { NodeFactory } from "./nodes/types";
import { Connection } from "./connection";

export async function createNode(
  di: DiContainer,
  name: keyof typeof nodes,
  data: any
) {
  const nodes = {
    [Nodes.Start.name]: () => new Nodes.Start(di),
    [Nodes.Log.name]: () => new Nodes.Log(di),
    [Nodes.TextNode.name]: () => new Nodes.TextNode(di, data),
  };
  const matched = nodes[name];

  if (!matched) throw new Error(`Unsupported node '${name}'`);
  const node = await matched();
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
    const node = await createNode(di, n.name as any, n.data);
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
  await di.arrange?.layout()
}

export function exportEditor(editor: NodeEditor<Schemes>) {
  const nodes = [];
  const edges = [];

  for (const n of editor.getNodes()) {
    nodes.push({
      id: n.id,
      name: n.constructor.name,
      data: n.serialize(),
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
