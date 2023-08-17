import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { objectSocket } from "../../sockets";
import { ClassicPreset } from "rete";

const composeObjectMachine = createMachine({
  id: "composeObject",
});

export class ComposeObject extends BaseNode<typeof composeObjectMachine> {
  constructor(di: DiContainer, data: NodeData<typeof composeObjectMachine>) {
    super("Componse Object", di, data, composeObjectMachine, {});

    this.addOutput("object", new ClassicPreset.Output(objectSocket, "Object"));

    // const inputGenerator = new SocketGeneratorControl({
    //   connectionType: 'input',
    //   name: 'Input Sockets',
    //   ignored: ['trigger'],
    //   tooltip: 'Add input sockets'
    // })
  }

  async execute() {}

  data(inputs: any) {
    return {
      object: {
        name: "RANDOM " + +new Date(),
      },
    };
  }

  serialize() {
    return {
      object: {},
    };
  }
}
