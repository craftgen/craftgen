"use client";

import { createRoot } from "react-dom/client";
import { ClassicPreset, NodeEditor } from "rete";
import { AreaPlugin, AreaExtensions, Area2D, Zoom } from "rete-area-plugin";
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from "rete-connection-plugin";
import {
  AutoArrangePlugin,
  Presets as ArrangePresets,
} from "rete-auto-arrange-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import { structures } from "rete-structures";
import { DataflowEngine } from "rete-engine";
import { ControlFlowEngine } from "./engine/control-flow-engine";
import {
  HistoryPlugin,
  HistoryActions,
  Presets as HistoryPresets,
  HistoryExtensions,
} from "rete-history-plugin";
import { ReadonlyPlugin } from "rete-readonly-plugin";
import { curveMonotoneX } from "d3-shape";
import { ConnectionPathPlugin } from "rete-connection-path-plugin";

import { CustomNode } from "./ui/custom-node";
import { addCustomBackground } from "./ui/custom-background";
import { CustomSocket } from "./ui/custom-socket";
import { ConnProps, NodeProps, Schemes } from "./types";
import { CustomConnection } from "./connection/custom-connection";
import { importEditor } from "./io";
// import { getWorkflow, getWorkflowById } from "../../action";
import { InspectorPlugin } from "./plugins/inspectorPlugin";
import { ReteStoreInstance } from "./store";
import { getControl } from "./control";

import ELK from "elkjs/lib/elk.bundled.js";
import { Modules } from "./modules";
import { createControlFlowEngine, createDataFlowEngine } from "./engine/engine";
import { useMagneticConnection } from "./connection";
import { ResultOf, ResultOfAction } from "@/lib/type";
import { Structures } from "rete-structures/_types/types";
import { getWorkflow } from "@/actions/get-workflow";
import { getWorkflowById } from "@/actions/get-workflow-by-id";
import { setupPanningBoundary } from "./plugins/panningBoundary";
import { Editor } from "@seocraft/core";
import { WorkflowAPI, nodes } from "@seocraft/core/src/types";

class CustomArrange extends AutoArrangePlugin<Schemes> {
  elk = new ELK();
}

export type AreaExtra = ReactArea2D<Schemes>;

export type DiContainer = {
  headless: boolean;
  logger?: any; // TODO: fix types
  store: any; // TODO: fix types
  graph: Structures<NodeProps, ConnProps>;
  area?: AreaPlugin<Schemes, AreaExtra>;
  areaControl?: {
    zoomAtNodes(nodeIds?: string[]): Promise<void>;
    nodeSelector?: ReturnType<typeof AreaExtensions.selectableNodes>;
  };
  setUI: () => Promise<void>;
  editor: NodeEditor<Schemes>;
  readonly?: ReadonlyPlugin<Schemes>;
  engine?: ControlFlowEngine<Schemes>;
  dataFlow?: DataflowEngine<Schemes>;
  arrange?: AutoArrangePlugin<Schemes>;
  inspector: InspectorPlugin;
  render: ReactPlugin<Schemes, AreaExtra>;
  modules: Modules;
};

export type ModuleMap = Record<string, ResultOf<typeof getWorkflow>>;

export const createEditorFunc = (params: {
  workflow: ResultOfAction<typeof getWorkflow>;
  store: ReteStoreInstance;
}) => {
  return (container: HTMLElement) => createEditor({ ...params, container });
};

// export const nodes = {
//   Start: Start,
//   Log: Log,
//   TextNode: TextNode,
//   Number: Number,
//   PromptTemplate: PromptTemplate,
//   OpenAIFunctionCall: OpenAIFunctionCall,

//   ComposeObject: ComposeObject,
//   Article: Article,

//   InputNode,
//   OutputNode,
//   ModuleNode,

//   Replicate: Replicate,

//   // DataSources
//   GoogleSheet: GoogleSheet,
//   Shopify: Shopify,
//   Webflow: Webflow,
//   Wordpress: Wordpress,
//   Postgres: Postgres,
// } as const;

export async function createEditor(params: {
  container: HTMLElement;
  workflow: ResultOfAction<typeof getWorkflow>;
  store: ReteStoreInstance;
}) {
  const di = new Editor({
    config: {
      nodes,
      api: {
        async checkAPIKeyExist(params) {
          return true;
        },
        async getAPIKey(params) {
          return "";
        },
        async updateExecutionNode(params) {},
        async triggerWorkflowExecutionStep(params) {},
        async setContext(params) {},
      } as WorkflowAPI,
    },
    content: {
      nodes: [
        nodes.InputNode.parse({
          id: "1",
          projectId: "",
          workflowId: "",
          workflowVersionId: "",
          contextId: "",
          position: {
            x: 0,
            y: 0,
          },
          width: 0,
          height: 0,
          label: "",
          color: "",
        }),
      ],
      edges: [],
    },
  });
  await di.mount({
    container: params.container,
    costumize: {
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
  });
  await di.setup();
  console.log(di);
  addCustomBackground(di?.area);

  // // RENDER RELATED STUFF
  // const render = new ReactPlugin<Schemes, AreaExtra>({
  //   createRoot: (container) =>
  //     createRoot(container, {
  //       identifierPrefix: "rete-",
  //     }),
  // });
  // render.addPreset(
  //   Presets.classic.setup({
  //     customize: {
  //       node(context) {
  //         // TODO: fix types some point
  //         return ({ data, emit }: any) =>
  //           CustomNode({ data, emit, store: params.store }) as any;
  //       },
  //       socket(context) {
  //         const { payload, ...meta } = context;
  //         return (data) => CustomSocket({ data: payload as any, meta }) as any;
  //       },
  //       connection(context) {
  //         return CustomConnection;
  //       },
  //       control(data) {
  //         return getControl(data);
  //       },
  //     },
  //   })
  // );
  // // END RENDER RELATED STUFF
  // const pathPlugin = new ConnectionPathPlugin<Schemes, Area2D<Schemes>>({
  //   curve: (c) => c.curve || curveMonotoneX,
  // });
  // // @ts-ignore
  // render.use(pathPlugin);
  // di.editor.use(area);

  const arrange = new CustomArrange();

  const history = new HistoryPlugin<Schemes, HistoryActions<Schemes>>();
  history.addPreset(HistoryPresets.classic.setup());
  HistoryExtensions.keyboard(history);

  arrange.addPreset(
    ArrangePresets.classic.setup({
      spacing: 40,
      top: 100,
      bottom: 100,
    })
  );
  const inspector = new InspectorPlugin(params.store);

  // AreaExtensions.simpleNodesOrder(area);

  const layout = async () =>
    await arrange.layout({
      options: {
        "elk.spacing.nodeNode": 100,
        "spacing.nodeNodeBetweenLayers": 100,
      } as any,
    });

  // AreaExtensions.showInputControl(area);

  // area.use(render);
  // area.use(arrange);

  return di;
  // {
  //   di,
  //   // area,
  //   editor: di.editor,
  //   destroy: () => {
  //     area.destroy();
  //     panningBoundary.destroy();
  //   },
  // };
}

export async function createEditor2(params: {
  container: HTMLElement;
  workflow: ResultOfAction<typeof getWorkflow>;
  store: ReteStoreInstance;
}) {
  const readonlyPlugin = new ReadonlyPlugin<Schemes>();
  const editor = new NodeEditor<Schemes>();
  editor.use(readonlyPlugin.root);
  const area = new AreaPlugin<Schemes, AreaExtra>(params.container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({
    createRoot: (container) =>
      createRoot(container, {
        identifierPrefix: "rete-",
      }),
  });

  const pathPlugin = new ConnectionPathPlugin<Schemes, Area2D<Schemes>>({
    curve: (c) => c.curve || curveMonotoneX,
  });

  // @ts-ignore
  render.use(pathPlugin);

  const selector = AreaExtensions.selector();

  const nodeSelector = AreaExtensions.selectableNodes(area, selector, {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });
  AreaExtensions.restrictor(area, {
    scaling: () => ({ min: 0.2, max: 1 }),
  });

  area.area.setZoomHandler(new Zoom(0.03));
  AreaExtensions.snapGrid(area, {
    dynamic: false,
    size: 20,
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
  connection.addPreset(ConnectionPresets.classic.setup());
  const engine = createControlFlowEngine();
  const dataFlow = createDataFlowEngine();

  const arrange = new CustomArrange();

  const history = new HistoryPlugin<Schemes, HistoryActions<Schemes>>();
  history.addPreset(HistoryPresets.classic.setup());
  HistoryExtensions.keyboard(history);

  arrange.addPreset(
    ArrangePresets.classic.setup({
      spacing: 40,
      top: 100,
      bottom: 100,
    })
  );
  const inspector = new InspectorPlugin(params.store);

  editor.use(engine);
  editor.use(dataFlow);
  editor.use(area);
  area.use(readonlyPlugin.area);
  addCustomBackground(area);
  area.use(inspector);
  area.use(history);

  if (!params.workflow.readonly) {
    area.use(connection);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMagneticConnection(connection, {
      async createConnection(from, to) {
        if (from.side === to.side) return;
        const [source, target] =
          from.side === "output" ? [from, to] : [to, from];
        const sourceNode = editor.getNode(source.nodeId);
        const targetNode = editor.getNode(target.nodeId);

        await editor.addConnection(
          new ClassicPreset.Connection(
            sourceNode,
            source.key as never,
            targetNode,
            target.key as never
          )
        );
      },
      display(from, to) {
        return from.side !== to.side;
      },
      offset(socket, position) {
        const socketRadius = 10;

        return {
          x:
            position.x +
            (socket.side === "input" ? -socketRadius : socketRadius),
          y: position.y,
        };
      },
    });
  }

  area.use(render);
  area.use(arrange);
  const panningBoundary = setupPanningBoundary({
    area,
    selector,
    padding: 30,
    intensity: 3,
  });

  AreaExtensions.simpleNodesOrder(area);

  const layout = async () =>
    await arrange.layout({
      options: {
        "elk.spacing.nodeNode": 100,
        "spacing.nodeNodeBetweenLayers": 100,
      } as any,
    });

  AreaExtensions.showInputControl(area);
  const setUI = async () => {
    await layout();
    AreaExtensions.zoomAt(area, editor.getNodes());
  };

  const modules = new Modules(async ({ moduleId, overwrites }) => {
    const data = await getWorkflowById(moduleId);
    if (!data) throw new Error(`Module ${moduleId} not found`);
    await importEditor(
      {
        ...di,
        ...overwrites,
      },
      {
        nodes: data.nodes as any,
        edges: data.edges as any,
      }
    );
  });

  const areaControl = {
    async zoomAtNodes(nodeIds: string[] = []) {
      AreaExtensions.zoomAt(
        area,
        editor
          .getNodes()
          .filter((n) => (nodeIds.length > 0 ? nodeIds.includes(n.id) : true))
      );
    },
    nodeSelector,
  };

  const graph = structures(editor);
  const di: DiContainer = {
    headless: false,
    logger: console,
    store: params.store,
    editor,
    area,
    areaControl,
    arrange,
    graph,
    setUI,
    render,
    engine,
    dataFlow,
    inspector,
    modules,
    readonly: readonlyPlugin,
  };

  await importEditor(di, {
    nodes: params.workflow.versions[0].nodes, // TODO:
    edges: params.workflow.versions[0].edges as any, //TODO: fix this types.
  });
  await layout();

  AreaExtensions.zoomAt(area, editor.getNodes());

  params.store.getState().setDi(di);

  if (params.workflow.readonly) {
    readonlyPlugin.enable();
  }

  return {
    di,
    editor,
    engine,
    dataFlow,
    area,
    destroy: () => {
      area.destroy();
      panningBoundary.destroy();
    },
  };
}
