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
    exec: typeof triggerSocket;
  },
  {
    exec: typeof triggerSocket;
  },
  {}
> {
  constructor(di: DiContainer, data: NodeData<typeof databaseInsertMachine>) {
    super("Database Insert", di, data, databaseInsertMachine, {});
    this.addInput(
      "databaseId",
      new ClassicPreset.Input(databaseIdSocket, "databaseId", false)
    );
    this.addInput("exec", new ClassicPreset.Input(triggerSocket, "Exec", true));
    this.addOutput(
      "exec",
      new ClassicPreset.Output(triggerSocket, "Exec", true)
    );
    this.addInput("data", new ClassicPreset.Input(objectSocket, "data"));
  }

  async execute(input: "exec", forward: (output: "exec") => void) {
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
    forward("exec");
  }

  async data() {}

  async serialize() {
    return {};
  }
}
