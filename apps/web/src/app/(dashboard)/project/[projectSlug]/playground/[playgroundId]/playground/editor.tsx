"use client";

import { createRoot } from "react-dom/client";
import { NodeEditor } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from "rete-connection-plugin";
import {
  AutoArrangePlugin,
  Presets as ArrangePresets,
} from "rete-auto-arrange-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import { MinimapExtra } from "rete-minimap-plugin";
import { structures } from "rete-structures";
import { ContextMenuExtra } from "rete-context-menu-plugin";
import { DataflowEngine, ControlFlowEngine } from "rete-engine";
import {
  HistoryPlugin,
  HistoryActions,
  Presets as HistoryPresets,
  HistoryExtensions,
} from "rete-history-plugin";

import { CustomNode } from "./ui/custom-node";
import { addCustomBackground } from "./ui/custom-background";
import { CustomSocket } from "./ui/custom-socket";
import { Schemes } from "./types";
import { CustomConnection } from "./ui/custom-connection";
import { importEditor } from "./io";
import { getPlayground } from "../action";
import { InspectorPlugin } from "./plugins/inspectorPlugin";
import { ReteStoreInstance } from "./store";
import { getControl } from "./control";

import ELK from "elkjs/lib/elk.bundled.js";
import { Modules } from "./modules";
import { createControlFlowEngine, createDataFlowEngine } from "./engine";
const elk = new ELK();

type AreaExtra = ReactArea2D<Schemes> | MinimapExtra | ContextMenuExtra;

export type DiContainer = {
  store: any; // TODO: fix types
  graph: ReturnType<typeof structures>;
  area: AreaPlugin<Schemes, AreaExtra>;
  setUI: () => Promise<void>;
  editor: NodeEditor<Schemes>;
  engine?: ControlFlowEngine<Schemes>;
  dataFlow?: DataflowEngine<Schemes>;
  arrange?: AutoArrangePlugin<Schemes>;
  inspector: InspectorPlugin;
  render: ReactPlugin<Schemes, AreaExtra>;
  modules: Modules;
};

export type ModuleMap = Record<
  string,
  NonNullable<Awaited<ReturnType<typeof getPlayground>>>
>;

export const createEditorFunc = (
  playground: NonNullable<Awaited<ReturnType<typeof getPlayground>>>,
  store: ReteStoreInstance
) => {
  return (container: HTMLElement) => createEditor(container, playground, store);
};

export async function createEditor(
  container: HTMLElement,
  playground: NonNullable<Awaited<ReturnType<typeof getPlayground>>>,
  store: ReteStoreInstance
) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
  // const minimap = new MinimapPlugin<Schemes>();

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });
  AreaExtensions.restrictor(area, {
    scaling: () => ({ min: 0.4, max: 1 }),
    // translation: () => ({ left: 600, top: 600, right: 600, bottom: 600 })
  });
  AreaExtensions.snapGrid(area, {
    size: 20,
  });

  render.addPreset(
    Presets.classic.setup({
      customize: {
        node(context) {
          // TODO: fix types some point
          return ({ data, emit }: any) =>
            CustomNode({ data, emit, store }) as any;
        },
        socket(context) {
          return CustomSocket;
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

  // const applier = new ArrangeAppliers.TransitionApplier<Schemes, never>({
  //   duration: 500,
  //   timingFunction: (t) => t,
  //   async onTick() {
  //     await AreaExtensions.zoomAt(area, editor.getNodes());
  //   },
  // });

  arrange.addPreset(ArrangePresets.classic.setup());
  const inspector = new InspectorPlugin(store);

  editor.use(engine);
  editor.use(dataFlow);
  editor.use(area);
  addCustomBackground(area);
  area.use(inspector);
  area.use(history);
  area.use(connection);
  area.use(render);
  area.use(arrange);

  AreaExtensions.simpleNodesOrder(area);

  AreaExtensions.showInputControl(area);
  const setUI = async () => {
    await arrange.layout();
    AreaExtensions.zoomAt(area, editor.getNodes());
  };
  const modules = new Modules(
    (moduleId) => {
      // const modules = getModuleData();
      // if (modules[moduleId]) {
      //   return true;
      // }
      return true;
    },
    async ({ moduleId, overwrites }) => {
      const data = await getPlayground({ playgroundId: moduleId });
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
    }
  );

  const graph = structures(editor);
  const di: DiContainer = {
    store,
    editor,
    area,
    arrange,
    graph,
    setUI,
    render,
    engine,
    dataFlow,
    inspector,
    modules,
  };

  await importEditor(di, {
    nodes: playground.nodes as any,
    edges: playground.edges as any,
  });
  await arrange.layout();

  AreaExtensions.zoomAt(area, editor.getNodes());

  store.getState().setDi(di);

  return {
    di,
    editor,
    engine,
    dataflow: dataFlow,
    destroy: () => area.destroy(),
  };
}
