import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { ClassicPreset } from "rete";
import { databaseIdSocket, Socket } from "../../sockets";

const databaseSelectMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGggEMAXQgI0NjAGUwAbMAY2PxAActYBLYrrDVgA9EARgBM6AJ6ixyOciA */
  id: "databaseSelect",
});

export class DatabaseSelect extends BaseNode<typeof databaseSelectMachine> {
  constructor(di: DiContainer, data: NodeData<typeof databaseSelectMachine>) {
    super("DatabaseSelect", di, data, databaseSelectMachine, {});

    this.addInput(
      "databaseId",
      new ClassicPreset.Input(databaseIdSocket, "databaseId")
    );
  }

  async invoke() {}

  async data() {}

  async serialize() {}
}
