import { createRoot } from "react-dom/client";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
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
import { DataflowEngine, ControlFlowEngine } from "rete-engine";
import { CustomNode } from "./ui/custom-node";
import { addCustomBackground } from "./ui/custom-background";
import { CustomSocket } from "./ui/custom-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Schemes } from "./types";
import { ActionSocket, TextSocket } from "./sockets";
import { getConnectionSockets } from "./utis";
import { Log, Start, TextNode } from "./nodes";
import { Connection } from "./connection";

type AreaExtra = ReactArea2D<Schemes> | MinimapExtra;

class Node extends ClassicPreset.Node<
  { [key in string]: ClassicPreset.Socket },
  { [key in string]: ClassicPreset.Socket },
  {
    [key in string]:
      | ButtonControl
      | ClassicPreset.Control
      | ClassicPreset.InputControl<"number">
      | ClassicPreset.InputControl<"text">;
  }
> {}

function CustomInput(props: { data: ClassicPreset.InputControl<"text"> }) {
  return (
    <Input
      disabled={props.data.readonly}
      value={props.data.value}
      onChange={(e) => props.data.setValue(e.target.value as string)}
    />
  );
}

export class ButtonControl extends ClassicPreset.Control {
  __type = "ButtonControl";

  constructor(public label: string, public onClick: () => void) {
    super();
  }
}

function CustomButton(props: { data: ButtonControl }) {
  return (
    <Button
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      size={"sm"}
      onClick={props.data.onClick}
    >
      {props.data.label}
    </Button>
  );
}

export type DiContainer = {
  // updateControl: (id: string) => void
  // updateNode: (id: string) => void
  // process: () => void
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

  render.addPreset(
    Presets.classic.setup({
      customize: {
        node() {
          return CustomNode;
        },
        socket(context) {
          return CustomSocket;
        },
        control(data) {
          if (data.payload instanceof ButtonControl) {
            return CustomButton;
          }
          // return Presets.classic.Control(data.payload);
          if (data.payload instanceof ClassicPreset.InputControl) {
            return Presets.classic.InputControl;
          }
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
  const dataflow = new DataflowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input.socket instanceof TextSocket)
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, output]) => output.socket instanceof TextSocket)
          .map(([name]) => name),
    };
  });
  const arrange = new AutoArrangePlugin<Schemes>();
  arrange.addPreset(ArrangePresets.classic.setup());

  editor.use(engine);
  editor.use(dataflow);
  editor.use(area);
  addCustomBackground(area);
  area.use(minimap);
  area.use(connection);
  area.use(render);
  area.use(arrange);
  render.addPreset(Presets.minimap.setup({ size: 200 }));
  editor.addPipe((context) => {
    // TO DO:

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

  const di: DiContainer = {
    editor,
    arrange,
    engine: engine,
    dataFlow: dataflow,
  };

  const start = new Start(di);
  const text1 = new TextNode(di, {
    value: 'log'
  });
  const log1 = new Log(di);

  const con1 = new Connection(start, "exec", log1, "exec");
  const con2 = new Connection(text1, "value", log1, "message");

  await editor.addNode(start);
  await editor.addNode(text1);
  await editor.addNode(log1);

  await editor.addConnection(con1);
  await editor.addConnection(con2);
  // setInterval(() => {
  //   dataflow.reset();
  //   engine.execute(start.id);
  // }, 1000);

  await arrange.layout();
  AreaExtensions.zoomAt(area, editor.getNodes());

  return {
    di,
    editor,
    engine,
    dataflow,
    destroy: () => area.destroy(),
  };
}
