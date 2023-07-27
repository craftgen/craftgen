import { ClassicPreset, NodeEditor } from "rete";
import { Schemes } from "./types";
import { ActionSocket } from "./sockets";
import { Start } from "./nodes";

function serializePort(
  port:
    | ClassicPreset.Input<ClassicPreset.Socket>
    | ClassicPreset.Output<ClassicPreset.Socket>
) {
  return {
    id: port.id,
    label: port.label,
    socket: {
      name: port.socket.name,
    },
  };
}

function serializeControl(control: ClassicPreset.Control) {
  if (control instanceof ClassicPreset.InputControl) {
    return {
      __type: "ClassicPreset.InputControl" as const,
      id: control.id,
      readonly: control.readonly,
      type: control.type,
      value: control.value,
    };
  }
  return null;
}

export async function exportGraph(editor: NodeEditor<Schemes>) {
  const data: any = { nodes: [], codes: [] };
  const nodes = editor.getNodes();

  for (const node of nodes) {
    try {
      const code = instanceToPlain(node);
      if (node instanceof Start) {
        const node2 = plainToInstance<Start, any>(Start, code, {
          targetMaps: [
            {
              target: ClassicPreset.Control,
              properties: {
                socket: ActionSocket,
              }
            }
          ]
        });
        console.log({ node, code, node2 });
      }
      data.codes.push(code);
    } catch (err) {
      console.log({ err });
    }
  }
  //   const inputsEntries = Object.entries(node.inputs).map(([key, input]) => {
  //     return [key, input && serializePort(input)];
  //   });
  //   const outputsEntries = Object.entries(node.outputs).map(([key, output]) => {
  //     return [key, output && serializePort(output)];
  //   });
  //   const controlsEntries = Object.entries(node.controls).map(
  //     ([key, control]) => {
  //       return [key, control && serializeControl(control)];
  //     }
  //   );

  //   data.nodes.push({
  //     id: node.id,
  //     label: node.label,
  //     outputs: Object.fromEntries(outputsEntries),
  //     inputs: Object.fromEntries(inputsEntries),
  //     controls: Object.fromEntries(controlsEntries),
  //   });
  // }

  return {
    nodes: data.codes,
  };
}

export async function importGraph(data: any, editor: NodeEditor<Schemes>) {
  for (const code of data.nodes) {
    if (code.__type === "Start") {
      console.log("START");
      code.id = "starat" + Math.random();
      console.log(code);
      const node = plainToInstance<Start, any>(code, Start);
      console.log("ddd", node.id);
      // await editor.addNode(node);
    }
    // const node = plainToInstance(code, ClassicPreset.Node, {targetMaps: [{
    //   target: ClassicPreset.Input,
    //   properties: {
    //     socket: ActionSocket
    //   }
    // }]})
    // console.log(node)
    // plainToInstance();

    // await editor.addNode();
  }
}

// for (const { id, label, inputs, outputs, controls } of data.nodes) {
//   const node = new ClassicPreset.Node(label);

//   node.id = id;

//   Object.entries(inputs).forEach(([key, input]: [string, any]) => {
//     const socket = new ClassicPreset.Socket(input.socket.name);
//     const inp = new ClassicPreset.Input(socket, input.label);

//     inp.id = input.id;

//     node.addInput(key, input);
//   });
//   Object.entries(outputs).forEach(([key, output]: [string, any]) => {
//     const socket = new ClassicPreset.Socket(output.socket.name);
//     const out = new ClassicPreset.Output(socket, output.label);

//     out.id = output.id;

//     node.addOutput(key, out);
//   });
//   Object.entries<ReturnType<typeof serializeControl>>(controls).forEach(
//     ([key, control]) => {
//       if (!control) return;

//       if (control.__type === "ClassicPreset.InputControl") {
//         const ctrl = new ClassicPreset.InputControl(control.type, {
//           initial: control.value,
//           readonly: control.readonly,
//         });
//         node.addControl(key, ctrl);
//       }
//     }
//   );

//   await editor.addNode(node);
// }
// }

// void (async function () {
//   const editor = new NodeEditor<Schemes>();

//   const node = new Start()

//   // const socket = new ClassicPreset.Socket("My socket");
//   // const node = new ClassicPreset.Node("Label");

//   // node.addInput("port", new ClassicPreset.Input(socket, "label"));
//   // node.addOutput("port", new ClassicPreset.Output(socket, "Label"));
//   // node.addControl(
//   //   "control",
//   //   new ClassicPreset.InputControl("text", { initial: "data" })
//   // );

//   await editor.addNode(node);

//   const data = await exportGraph(editor);
//   console.log(data);

//   // document.body.innerText = JSON.stringify(data, null, "\t");

//   // const newEditor = new NodeEditor<Schemes>();

//   // await importGraph(data, newEditor);

//   // console.log(newEditor.getNodes());
// })();
