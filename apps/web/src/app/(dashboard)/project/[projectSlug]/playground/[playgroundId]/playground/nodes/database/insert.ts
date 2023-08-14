import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { databaseIdSocket, objectSocket } from "../../sockets";
import { ClassicPreset } from "rete";
import { insertDataSet } from "../../../action";

const databaseInsertMachine = createMachine({
  id: "databaseInsert",
});

export class DatabaseInsert extends BaseNode<
  typeof databaseInsertMachine,
  {
    databaseId: typeof databaseIdSocket;
    data: typeof objectSocket;
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
    this.addInput("data", new ClassicPreset.Input(objectSocket, "data"));
  }

  async invoke() {
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      dataBaseId: string;
      data: Record<string, unknown>;
    };
    await insertDataSet({
      id: inputs.dataBaseId,
      data: inputs.data,
    });
  }

  async data() {}

  async serialize() {
    return {};
  }
}
