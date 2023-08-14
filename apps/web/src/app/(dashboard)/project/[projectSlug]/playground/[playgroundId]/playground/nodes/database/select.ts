import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { TextSocket } from "../../sockets";
import { ClassicPreset } from "rete";

const databaseSelectMachine = createMachine({
  id: "databaseSelect",
});

export class DatabaseSelect extends BaseNode<
  typeof databaseSelectMachine,
  {
    databaseId: TextSocket;
  },
  {},
  {}
> {
  constructor(di: DiContainer, data: NodeData<typeof databaseSelectMachine>) {
    super("DatabaseSelect", di, data, databaseSelectMachine, {});

    this.addInput(
      "databaseId",
      new ClassicPreset.Input(new TextSocket(), "databaseId")
    );
  }

  async invoke() {}

  async data() {}

  async serialize() {}
}
