"use client";

import { createRoot } from "react-dom/client";
import { ClassicPreset, NodeEditor } from "rete";
import {
  AreaPlugin,
  AreaExtensions,
  Area2D,
  Zoom,
} from "rete-area-plugin";
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
const elk = new ELK();

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

export async function createEditor(params: {
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
  // const minimap = new MinimapPlugin<Schemes>();

  const pathPlugin = new ConnectionPathPlugin<Schemes, Area2D<Schemes>>({
    curve: (c) => c.curve || curveMonotoneX,
    // transformer: () => Transformers.classic({ vertical: false }),
    // arrow: () => true
  });

  // @ts-ignore
  render.use(pathPlugin);

  // area.area.setDragHandler(
  //   new AreaDrag({
  //     down: (e) => {
  //       if (e.pointerType === "mouse" && e.button === 1) return false;
  //       e.preventDefault();
  //       return true;
  //     },

  //     move: (e) => {
  //       return true;
  //     },
  //   })
  // );
  const selector = AreaExtensions.selector();


  const nodeSelector = AreaExtensions.selectableNodes(
    area,
    selector,
    {
      accumulating: AreaExtensions.accumulateOnCtrl(),
    }
  );
  AreaExtensions.restrictor(area, {
    scaling: () => ({ min: 0.2, max: 1 }),
    // translation: () => ({ left: 600, top: 600, right: 600, bottom: 600 })
  });

  area.area.setZoomHandler(new Zoom(0.03));
  AreaExtensions.snapGrid(area, {
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

  class CustomArrange extends AutoArrangePlugin<Schemes> {
    elk = elk;
  }

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

  const panningBoundary = setupPanningBoundary({
    area,
    selector,
    padding: 50,
    intensity: 3
  });

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
      area.destroy()
      panningBoundary.destroy();
    },
  };
}
