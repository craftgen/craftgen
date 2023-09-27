import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { BaseNode, NodeData } from "./base";
import { createMachine } from "xstate";
import { anySocket, triggerSocket } from "../sockets";

const LogNodeMachine = createMachine({
  id: "log",
});

export class Log extends BaseNode<typeof LogNodeMachine> {
  static ID: "log";

  constructor(di: DiContainer, data: NodeData<typeof LogNodeMachine>) {
    super("Log", di, data, LogNodeMachine, {});

    this.addInput(
      "trigger",
      new ClassicPreset.Input(triggerSocket, "Exec", true)
    );
    this.addInput("foo", new ClassicPreset.Input(triggerSocket, "Foo", true));
    this.addInput("data", new ClassicPreset.Input(anySocket, "Data"));

    this.addOutput("trigger", new ClassicPreset.Output(triggerSocket, "Exec"));
  }

  async execute(
    input: "trigger",
    forward: (output: "trigger") => void,
    execId?: string
  ) {
    console.log("Execute entry", { input, forward, execId });

    this.di.dataFlow?.reset();
    const incomers = this.di.graph.incomers(this.id);

    incomers.nodes().forEach(async (n) => {
      await this.di.dataFlow?.fetch(n.id);
    });
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      data: Promise<any>[];
    };

    const inputData = await Promise.all(inputs.data);
    console.log(inputData);
    forward("trigger");
  }

  data() {
    return {};
  }

  serialize() {
    return {};
  }
}
