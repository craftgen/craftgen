import { createRoot } from "react-dom/client";
import { NodeEditor, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from "rete-connection-plugin";
import {
  AutoArrangePlugin,
  Presets as ArrangePresets,
  ArrangeAppliers,
} from "rete-auto-arrange-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import { MinimapExtra, MinimapPlugin } from "rete-minimap-plugin";
import { structures } from "rete-structures";
import {
  ContextMenuExtra,
  ContextMenuPlugin,
  Presets as ContextMenuPresets,
} from "rete-context-menu-plugin";
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
import { NodeTypes, Schemes } from "./types";
import { getConnectionSockets } from "./utis";
import { CustomContextMenu } from "./ui/context-menu";
import { CustomInput } from "./ui/control/custom-input";
import { CustomConnection } from "./ui/custom-connection";
import { ButtonControl, CustomButton } from "./ui/control/control-button";
import { CodeControl, CodeEditor } from "./ui/control/control-code";
import {
  SelectControl,
  SelectControlComponent,
} from "./ui/control/control-select";
import {
  TableControl,
  TableControlComponent,
} from "./ui/control/control-table";
import {
  DebugControl,
  DebugControlComponent,
} from "./ui/control/control-debug";
import { createNode } from "./io";
import type { getPlayground } from "../action";
import { InspectorPlugin } from "./plugins/inspectorPlugin";
import { ReteStoreInstance } from "./store";

type AreaExtra = ReactArea2D<Schemes> | MinimapExtra | ContextMenuExtra;

export type DiContainer = {
  // updateControl: (id: string) => void
  // updateNode: (id: string) => void
  // process: () => void
  graph: ReturnType<typeof structures>;
  area: AreaPlugin<Schemes, AreaExtra>;
  setUI: () => Promise<void>;
  editor: NodeEditor<Schemes>;
  engine?: ControlFlowEngine<Schemes>;
  dataFlow?: DataflowEngine<Schemes>;
  arrange?: AutoArrangePlugin<Schemes>;
  inspector: InspectorPlugin;
  // modules: Modules
};

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
  const minimap = new MinimapPlugin<Schemes>();

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });
  AreaExtensions.restrictor(area, {
    scaling: () => ({ min: 0.5, max: 1 }),
    // translation: () => ({ left: 600, top: 600, right: 600, bottom: 600 })
  });
  AreaExtensions.snapGrid(area, {
    size: 20,
  });

  render.addPreset(
    Presets.classic.setup({
      customize: {
        node() {
          return ({ data, emit }) => CustomNode({ data, emit, store });
        },
        socket(context) {
          return CustomSocket;
        },
        connection(context) {
          return CustomConnection;
        },
        control(data) {
          if (data.payload instanceof ButtonControl) {
            return CustomButton;
          }
          if (data.payload instanceof CodeControl) {
            return CodeEditor;
          }
          if (data.payload instanceof SelectControl) {
            return SelectControlComponent;
          }
          if (data.payload instanceof TableControl) {
            return TableControlComponent;
          }
          if (data.payload instanceof DebugControl) {
            return DebugControlComponent;
          }
          // return Presets.classic.Control(data.payload);
          if (data.payload instanceof ClassicPreset.InputControl) {
            // return Presets.classic.InputControl
            return CustomInput;
          }
          return Presets.classic.Control;
          // if (data.payload instanceof ClassicPreset.InputControl) {
          //   return Presets.classic.Control;
          // }
          return null;
        },
      },
    })
  );

  connection.addPreset(ConnectionPresets.classic.setup());
  const engine = new ControlFlowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input?.socket?.name === "Trigger")
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, input]) => input?.socket?.name === "Trigger")
          .map(([name]) => name),
    };
  });
  const dataFlow = new DataflowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input?.socket?.name !== "Trigger")
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, input]) => input?.socket?.name !== "Trigger")
          .map(([name]) => name),
    };
  });

  const curriedCreateNode = ({
    name,
    data,
  }: {
    name: NodeTypes;
    data?: any;
  }) => {
    return createNode({
      di,
      name,
      data,
      saveToDB: true,
      playgroundId: playground.id,
      projectSlug: playground.project?.slug,
    });
  };
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup([
      [
        "Database",
        [
          ["Insert", () => curriedCreateNode({ name: "DatabaseInsert" })],
          ["Update", () => curriedCreateNode({ name: "DatabaseUpdate" })],
          ["Upsert", () => curriedCreateNode({ name: "DatabaseUpsert" })],
          ["Delete", () => curriedCreateNode({ name: "DatabaseDelete" })],
          ["Select", () => curriedCreateNode({ name: "DatabaseSelect" })],
        ],
      ],
      ["Log", () => curriedCreateNode({ name: "Log" })],
      [
        "Text",
        () =>
          curriedCreateNode({
            name: "TextNode",
          }),
      ],
      ["Start", () => curriedCreateNode({ name: "Start" })],
      ["Prompt Template", () => curriedCreateNode({ name: "PromptTemplate" })],
      ["OpenAI", () => curriedCreateNode({ name: "OpenAIFunctionCall" })],
      ["Data Source", () => curriedCreateNode({ name: "DataSource" })],
    ]),
  });
  const arrange = new AutoArrangePlugin<Schemes>();

  const history = new HistoryPlugin<Schemes, HistoryActions<Schemes>>();
  history.addPreset(HistoryPresets.classic.setup());
  HistoryExtensions.keyboard(history);

  const applier = new ArrangeAppliers.TransitionApplier<Schemes, never>({
    duration: 500,
    timingFunction: (t) => t,
    async onTick() {
      await AreaExtensions.zoomAt(area, editor.getNodes());
    },
  });

  arrange.addPreset(ArrangePresets.classic.setup());
  const inspector = new InspectorPlugin(store);

  editor.use(engine);
  editor.use(dataFlow);
  editor.use(area);
  addCustomBackground(area);
  area.use(inspector);
  area.use(history);
  area.use(minimap);
  area.use(connection);
  area.use(contextMenu);
  area.use(render);
  area.use(arrange);
  render.addPreset(Presets.minimap.setup({ size: 180 }));
  render.addPreset(CustomContextMenu);

  editor.addPipe((context) => {
    if (context.type === "connectioncreate") {
      const { data } = context;
      const { source, target } = getConnectionSockets(editor, data);
      if (!source.isCompatibleWith(target)) {
        console.log("Sockets are not compatible", "error");
        return;
      }
    }
    return context;
  });

  AreaExtensions.simpleNodesOrder(area);

  AreaExtensions.showInputControl(area);

  await arrange.layout();
  AreaExtensions.zoomAt(area, editor.getNodes());
  const setUI = async () => {
    await arrange.layout({ applier });
    AreaExtensions.zoomAt(area, editor.getNodes());
  };

  const graph = structures(editor);

  const di: DiContainer = {
    editor,
    area,
    arrange,
    graph,
    setUI,
    engine: engine,
    dataFlow,
    inspector,
  };

  store.getState().setDi(di);

  return {
    di,
    editor,
    engine,
    dataflow: dataFlow,
    destroy: () => area.destroy(),
  };
}
