import { GetSchemes, NodeEditor, NodeId } from "rete";
import { createControlFlowEngine, createDataFlowEngine } from "./engine";
import { BaseNode, ParsedNode } from "./nodes/base";
import { Connection } from "./connection/connection";
import { NodeClass, WorkflowAPI, Node } from "./types";
import { ContextFrom, SnapshotFrom } from "xstate";
import { type Structures } from "rete-structures/_types/types";
import { structures } from "rete-structures";

type NodeRegistry = {
  [key: string]: NodeClass;
};

export type NodeWithState<
  T extends NodeRegistry,
  K extends keyof T = keyof T
> = Node & {
  type: keyof T;
  context: ContextFrom<InstanceType<T[K]>["machine"]>;
  state?: SnapshotFrom<InstanceType<T[K]>["machine"]>;
};

// Define a utility type to convert ParsedNode to NodeWithState
type ConvertToNodeWithState<
  T extends NodeRegistry,
  P extends ParsedNode<any, any>
> = {
  [K in keyof P]: K extends "type" ? keyof T : P[K];
};

export type EditorProps<
  NodeProps extends BaseNode<any, any, any>,
  ConnProps extends Connection<NodeProps, NodeProps>,
  Scheme extends GetSchemes<NodeProps, ConnProps>,
  Registry extends NodeRegistry
> = {
  config: { nodes: Registry; api: WorkflowAPI; logger?: typeof console };
  content?: {
    // nodes: NodeWithState<Registry>[];
    nodes: ConvertToNodeWithState<Registry, ParsedNode<any, any>>[];
    edges: ConnProps[];
  };
};

export class Editor<
  NodeProps extends BaseNode<any, any, any> = BaseNode<any, any, any>,
  ConnProps extends Connection<NodeProps, NodeProps> = Connection<
    NodeProps,
    NodeProps
  >,
  Scheme extends GetSchemes<NodeProps, ConnProps> = GetSchemes<
    NodeProps,
    ConnProps
  >,
  Registry extends NodeRegistry = NodeRegistry
> {
  public editor = new NodeEditor<Scheme>();
  public engine = createControlFlowEngine<Scheme>();
  public dataFlow = createDataFlowEngine<Scheme>();
  public graph: Structures<NodeProps, ConnProps> = structures(this.editor);
  public api: WorkflowAPI;

  public nodeMeta: Map<keyof Registry, NodeClass> = new Map();

  public content = {
    nodes: [] as NodeWithState<Registry>[],
    edges: [] as ConnProps[],
  };

  public logger = console;

  constructor(props: EditorProps<NodeProps, ConnProps, Scheme, Registry>) {
    Object.entries(props.config.nodes).forEach(([key, value]) => {
      this.nodeMeta.set(key as keyof Registry, value);
    });
    this.api = props.config.api;
    this.content = {
      nodes: (props.content?.nodes as NodeWithState<Registry>[]) || [],
      edges: props.content?.edges || [],
    };
    this.validateNodes(this.content);
  }

  public createNode(node: NodeWithState<Registry>) {
    const nodeClass = this.nodeMeta.get(node.type);
    if (!nodeClass) {
      throw new Error(`Node type ${String(node.type)} not registered`);
    }
    return new nodeClass(this, node) as NodeProps;
  }

  public async setup() {
    this.editor.use(this.engine);
    this.editor.use(this.dataFlow);

    await this.import(this.content);
  }

  public async import({
    nodes,
    edges,
  }: {
    nodes: NodeWithState<Registry>[];
    edges: ConnProps[];
  }) {
    for (const n of nodes) {
      if (this.editor.getNode(n.id)) continue;
      const node = this.createNode(n);
      // console.log({ node });
      await this.editor.addNode(node);
    }

    for (const c of edges) {
      const source = this.editor.getNode(c.source);
      const target = this.editor.getNode(c.target);

      if (
        source &&
        target &&
        source.outputs[c.sourceOutput] &&
        target.inputs[c.targetInput]
      ) {
        const conn = new Connection<NodeProps, NodeProps>(
          source,
          c.sourceOutput,
          target,
          c.targetInput
        );

        await this.editor.addConnection(conn as ConnProps);
      }
    }
  }

  public validateNodes({
    nodes,
    edges,
  }: {
    nodes: NodeWithState<Registry>[];
    edges: ConnProps[];
  }) {
    const nodesMap = new Map<NodeId, NodeProps>();
    for (const n of nodes) {
      if (!this.nodeMeta.has(n.type)) {
        throw new Error(`Node type ${String(n.type)} not registered`);
      }
      nodesMap.set(n.id, this.createNode(n));
    }
    for (const c of edges) {
      const source = nodesMap.get(c.source);
      if (!source)
        throw new Error(
          `Invalid connection:
          (${c.source})[${String(c.sourceOutput)}]  => (${c.target})[${String(
            c.targetInput
          )}]
          Source with id:${c.source} not found`
        );
      const target = nodesMap.get(c.target);
      if (!target) {
        throw new Error(
          `Invalid connection:
          (${c.source})[${String(c.sourceOutput)}]  => (${c.target})[${String(
            c.targetInput
          )}]
          Target with id:${c.target} not found`
        );
      }
      if (!source.outputs[c.sourceOutput]) {
        throw new Error(
          `Invalid connection:
           (${c.source})[${String(c.sourceOutput)}]  => (${c.target})[${String(
            c.targetInput
          )}]
          Source Output [${String(c.sourceOutput)}] not found`
        );
      }
      if (!target.inputs[c.targetInput]) {
        throw new Error(
          `Invalid connection:
          (${c.source})[${String(c.sourceOutput)}]  => (${c.target})[${String(
            c.targetInput
          )}]
          Target Input [${String(c.targetInput)}] not found`
        );
      }

      if (
        source &&
        target &&
        source.outputs[c.sourceOutput] &&
        target.inputs[c.targetInput]
      ) {
        // everything is ok
      } else {
        throw new Error(`Invalid connection ${JSON.stringify(c)}`);
      }
    }
  }
}
