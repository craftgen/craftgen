import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { DatabaseIdSocket } from "../../sockets";
import { ClassicPreset } from "rete";

const databaseInsertMachine = createMachine({
  id: "databaseInsert",
});

export class DatabaseInsert extends BaseNode<
  typeof databaseInsertMachine,
  {
    databaseId: DatabaseIdSocket;
  },
  {},
  {}
> {
  constructor(di: DiContainer, data: NodeData<typeof databaseInsertMachine>) {
    super("Database Insert", di, data, databaseInsertMachine, {});
    this.addInput(
      "databaseId",
      new ClassicPreset.Input(DatabaseIdSocket, "databaseId")
    );
  }

  async invoke() {}

  async data() {}

  async serialize() {}
}
