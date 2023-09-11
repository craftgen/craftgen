import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { databaseIdSocket, objectSocket, triggerSocket } from "../../sockets";
import { ClassicPreset } from "rete";
import { insertDataSet } from "../../../action";
import { mutate } from "swr";

const databaseInsertMachine = createMachine({
  id: "databaseInsert",
});

export class DatabaseInsert extends BaseNode<
  typeof databaseInsertMachine,
  {
    databaseId: typeof databaseIdSocket;
    data: typeof objectSocket;
    trigger: typeof triggerSocket;
  },
  {
    trigger: typeof triggerSocket;
  },
  {}
> {
  constructor(di: DiContainer, data: NodeData<typeof databaseInsertMachine>) {
    super("DatabaseInsert", "Insert", di, data, databaseInsertMachine, {});
    this.addInput(
      "trigger",
      new ClassicPreset.Input(triggerSocket, "Exec", true)
    );
    this.addInput(
      "databaseId",
      new ClassicPreset.Input(databaseIdSocket, "databaseId", false)
    );
    this.addOutput(
      "trigger",
      new ClassicPreset.Output(triggerSocket, "Exec", true)
    );
    this.addInput("data", new ClassicPreset.Input(objectSocket, "data"));
  }

  async execute(input: "trigger", forward: (output: "trigger") => void) {
    this.di.dataFlow?.reset();
    const incomers = this.di.graph.incomers(this.id);

    incomers.nodes().forEach((n) => {
      this.di.dataFlow?.fetch(n.id);
    });
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      databaseId: string[];
      data: Record<string, unknown>[];
    };
    console.log("insertInputs", inputs);
    await insertDataSet({
      id: inputs.databaseId[0],
      data: inputs.data[0],
    });
    await mutate(`/api/datasource/${inputs.databaseId[0]}`);
    forward("trigger");
  }

  async data() {}

  async serialize() {
    return {};
  }
}
