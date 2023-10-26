import { GetSchemes, NodeEditor, NodeId } from "rete";
import { createControlFlowEngine, createDataFlowEngine } from "./engine";
import { BaseNode, ParsedNode } from "./nodes/base";
import { Connection } from "./connection/connection";
import { NodeClass, WorkflowAPI, Node } from "./types";
import { ContextFrom, SnapshotFrom } from "xstate";
import { structures } from "rete-structures";
import { createId } from "@paralleldrive/cuid2";

import type { Structures } from "rete-structures/_types/types";
import type {
  Area2D,
  AreaExtensions,
  AreaPlugin,
  Zoom,
} from "rete-area-plugin";
import type { ClassicScheme, ReactArea2D, RenderEmit } from "rete-react-plugin";
import type { setupPanningBoundary } from "./plugins/panningBoundary";
import type { ExtractPayload } from "rete-react-plugin/_types/presets/classic/types";
import type { AcceptComponent } from "rete-react-plugin/_types/presets/classic/utility-types";
import type { CustomArrange } from "./plugins/arrage/custom-arrange";
import type { HistoryActions } from "rete-history-plugin";

export type AreaExtra<Schemes extends ClassicScheme> = ReactArea2D<Schemes>;

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
  config: {
    nodes: Registry;
    api: WorkflowAPI;
    logger?: typeof console;
    meta: {
      workflowId: string;
      workflowVersionId: string;
      projectId: string;
    };
  };
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
  Registry extends NodeRegistry = NodeRegistry,
  // NodeTypes extends StringKeyOf<Registry> = StringKeyOf<Registry>
  NodeTypes extends keyof Registry = keyof Registry
  // AreaExtra = ReactArea2D<Scheme>
> {
  public editor = new NodeEditor<Scheme>();
  public engine = createControlFlowEngine<Scheme>();
  public dataFlow = createDataFlowEngine<Scheme>();
  public graph: Structures<NodeProps, ConnProps> = structures(this.editor);
  public api: WorkflowAPI;

  // UI related
  public area?: AreaPlugin<Scheme, AreaExtra<Scheme>>;
  public areaControl?: {
    zoomAtNodes: (nodeIds: string[]) => Promise<void>;
  };
  public selector?: ReturnType<typeof AreaExtensions.selector>;
  public nodeSelector?: ReturnType<typeof AreaExtensions.selectableNodes>;
  public panningBoundary?: ReturnType<typeof setupPanningBoundary>;
  public arrange?: CustomArrange<Scheme>;

  public nodeMeta: Map<keyof Registry, NodeClass> = new Map();

  public content = {
    nodes: [] as NodeWithState<Registry>[],
    edges: [] as ConnProps[],
  };

  public logger = console;
  public readonly workflowId: string;
  public readonly workflowVersionId: string;
  public readonly projectId: string;

  constructor(props: EditorProps<NodeProps, ConnProps, Scheme, Registry>) {
    Object.entries(props.config.nodes).forEach(([key, value]) => {
      this.nodeMeta.set(key, value);
    });
    this.api = props.config.api;
    this.content = {
      nodes: (props.content?.nodes as NodeWithState<Registry>[]) || [],
      edges: props.content?.edges || [],
    };

    this.workflowId = props.config.meta.workflowId;
    this.workflowVersionId = props.config.meta.workflowVersionId;
    this.projectId = props.config.meta.projectId;

    this.validateNodes(this.content);
  }

  private createId(prefix: "node" | "conn" | "context" | "state") {
    return `${prefix}_${createId()}`;
  }

  public createNodeInstance(
    node: ConvertToNodeWithState<Registry, ParsedNode<any, any>>
  ) {
    const nodeClass = this.nodeMeta.get(node.type);
    if (!nodeClass) {
      throw new Error(`Node type ${String(node.type)} not registered`);
    }
    console.log(nodeClass?.nodeType);
    return new nodeClass(this, node) as NodeProps;
  }

  public async duplicateNode(node_Id: string) {
    const { state, executionNodeId, ...node } = await this.editor
      .getNode(node_Id)
      .serialize();
    const newNode = this.createNodeInstance({
      ...node,
      id: this.createId("node"),
      contextId: this.createId("context"),
    });
    return newNode;
  }

  public async addNode(node: NodeTypes) {
    const newNode = this.createNodeInstance({
      type: node,
      label: "New node",
      id: this.createId("node"),
      contextId: this.createId("context"),
    });
    await this.editor.addNode(newNode);
    return newNode;
  }

  public async setup() {
    this.editor.use(this.engine);
    this.editor.use(this.dataFlow);

    await this.import(this.content);
    await this.setUI();
  }

  public async mount(params: {
    container: HTMLElement;
    costumize?: {
      node?: (data: ExtractPayload<Scheme, "node">) => AcceptComponent<
        (typeof data)["payload"],
        {
          emit: RenderEmit<Scheme>;
        }
      > | null;
      connection?: (
        data: ExtractPayload<Scheme, "connection">
      ) => AcceptComponent<(typeof data)["payload"]> | null;
      socket?: (
        data: ExtractPayload<Scheme, "socket">
      ) => AcceptComponent<(typeof data)["payload"]> | null;
      control?: (
        data: ExtractPayload<Scheme, "control">
      ) => AcceptComponent<(typeof data)["payload"]> | null;
    };
  }) {
    const { AreaExtensions, AreaPlugin, Zoom } = await import(
      "rete-area-plugin"
    );
    this.area = new AreaPlugin(params.container);
    this.selector = AreaExtensions.selector();
    this.nodeSelector = AreaExtensions.selectableNodes(
      this?.area,
      this?.selector,
      {
        accumulating: AreaExtensions.accumulateOnCtrl(),
      }
    );
    AreaExtensions.restrictor(this.area, {
      scaling: () => ({ min: 0.2, max: 1 }),
    });
    this.area.area.setZoomHandler(new Zoom(0.03));
    AreaExtensions.snapGrid(this.area, {
      dynamic: false,
      size: 20,
    });
    AreaExtensions.simpleNodesOrder(this.area);
    AreaExtensions.showInputControl(this.area);

    const { ReactPlugin, Presets } = await import("rete-react-plugin");
    const { createRoot } = await import("react-dom/client");
    // RENDER RELATED STUFF
    const render = new ReactPlugin<Scheme, AreaExtra<Scheme>>({
      createRoot: (container) =>
        createRoot(container, {
          identifierPrefix: "rete-",
        }),
    });
    render.addPreset(
      Presets.classic.setup({
        customize: params.costumize,
      })
    );

    const { ConnectionPathPlugin } = await import(
      "rete-connection-path-plugin"
    );
    const { curveMonotoneX } = await import("d3-shape");
    const pathPlugin = new ConnectionPathPlugin<Scheme, Area2D<Scheme>>({
      curve: (c) => c.curve || curveMonotoneX,
    });

    // @ts-ignore
    render.use(pathPlugin);

    this.area.use(render);
    this.editor.use(this.area);
    const self = this;
    this.areaControl = {
      async zoomAtNodes(nodeIds) {
        if (!self.area) return;
        await AreaExtensions.zoomAt(
          self.area,
          self.editor
            .getNodes()
            .filter((n) => (nodeIds.length > 0 ? nodeIds.includes(n.id) : true))
        );
      },
    };

    const { setupPanningBoundary } = await import("./plugins/panningBoundary");
    this.panningBoundary = setupPanningBoundary({
      area: this.area,
      selector: this.selector,
      padding: 30,
      intensity: 3,
    });

    const { CustomArrange, ArrangePresets } = await import(
      "./plugins/arrage/custom-arrange"
    );
    this.arrange = new CustomArrange<Scheme>();
    this.arrange.addPreset(
      ArrangePresets.classic.setup({
        spacing: 40,
        top: 100,
        bottom: 100,
      })
    );
    this.area.use(this.arrange);

    const {
      HistoryPlugin,
      HistoryExtensions,
      Presets: HistoryPresets,
    } = await import("rete-history-plugin");
    const history = new HistoryPlugin<Scheme, HistoryActions<Scheme>>();
    history.addPreset(HistoryPresets.classic.setup());
    HistoryExtensions.keyboard(history);

    this.area.use(history);
  }

  public async layout() {
    await this.arrange?.layout({
      options: {
        "elk.spacing.nodeNode": 100,
        "spacing.nodeNodeBetweenLayers": 100,
      } as any,
    });
  }

  public async setUI() {
    await this.layout();
    await this.areaControl?.zoomAtNodes(
      this.editor.getNodes().map((n) => n.id)
    );
  }

  public destroy() {
    this.area?.destroy();
    this.panningBoundary?.destroy();
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
      const node = this.createNodeInstance(n);
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
      nodesMap.set(n.id, this.createNodeInstance(n));
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
