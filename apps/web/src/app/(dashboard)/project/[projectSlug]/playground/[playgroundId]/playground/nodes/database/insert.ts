import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { databaseIdSocket } from "../../sockets";
import { ClassicPreset } from "rete";

const databaseInsertMachine = createMachine({
  id: "databaseInsert",
});

export class DatabaseInsert extends BaseNode<
  typeof databaseInsertMachine,
  {
    databaseId: typeof databaseIdSocket;
  },
  {},
  {}
> {
  constructor(di: DiContainer, data: NodeData<typeof databaseInsertMachine>) {
    super("Database Insert", di, data, databaseInsertMachine, {});
    this.addInput(
      "databaseId",
      new ClassicPreset.Input(databaseIdSocket, "databaseId")
    );
  }

  async invoke() {}

  async data() {}

  async serialize() {
    return {};
  }
}
