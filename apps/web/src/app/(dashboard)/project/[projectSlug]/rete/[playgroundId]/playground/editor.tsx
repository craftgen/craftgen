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

import * as Nodes from "./nodes";

import { CustomNode } from "./ui/custom-node";
import { addCustomBackground } from "./ui/custom-background";
import { CustomSocket } from "./ui/custom-socket";
import { Schemes } from "./types";
import { ActionSocket, TextSocket } from "./sockets";
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

type AreaExtra = ReactArea2D<Schemes> | MinimapExtra | ContextMenuExtra;

export type DiContainer = {
  // updateControl: (id: string) => void
  // updateNode: (id: string) => void
  // process: () => void
  graph: ReturnType<typeof structures>;
  area: AreaPlugin<Schemes, AreaExtra>;
  setUI: () => void;
  editor: NodeEditor<Schemes>;
  engine?: ControlFlowEngine<Schemes>;
  dataFlow?: DataflowEngine<Schemes>;
  arrange?: AutoArrangePlugin<Schemes>;
  // modules: Modules
};

export async function createEditor(container: HTMLElement) {
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
          return CustomNode;
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
          .filter(([_, input]) => input.socket instanceof ActionSocket)
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, output]) => output.socket instanceof ActionSocket)
          .map(([name]) => name),
    };
  });
  const dataFlow = new DataflowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input?.socket instanceof TextSocket)
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, output]) => output.socket instanceof TextSocket)
          .map(([name]) => name),
    };
  });
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup([
      ["Log", () => createNode({ di, name: "Log", saveToDB: true })],
      [
        "Text",
        () =>
          createNode({
            di,
            name: "TextNode",
            data: { value: "text" },
            saveToDB: true,
          }),
      ],
      ["Start", () => createNode({ di, name: "Start", saveToDB: true })],
      [
        "Prompt Template",
        () => createNode({ di, name: "PromptTemplate", saveToDB: true }),
      ],
      [
        "OpenAI",
        () => createNode({ di, name: "OpenAIFunctionCall", saveToDB: true }),
      ],
      [
        "OpenAI Function",
        () => createNode({ di, name: "FunctionNode", saveToDB: true }),
      ],
      [
        "Data Source",
        () => createNode({ di, name: "DataSource", saveToDB: true }),
      ],
    ]),
  });
  const arrange = new AutoArrangePlugin<Schemes>();
  const history = new HistoryPlugin<Schemes, HistoryActions<Schemes>>();
  history.addPreset(HistoryPresets.classic.setup());
  HistoryExtensions.keyboard(history);

  arrange.addPreset(ArrangePresets.classic.setup());

  editor.use(engine);
  editor.use(dataFlow);
  editor.use(area);
  addCustomBackground(area);
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
    await arrange.layout();
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
  };

  return {
    di,
    editor,
    engine,
    dataflow: dataFlow,
    destroy: () => area.destroy(),
  };
}
