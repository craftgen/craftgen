import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { BaseNode, NodeData } from "./base";
import { createMachine } from "xstate";
import { anySocket, triggerSocket } from "../sockets";
import { structures } from "rete-structures";

const LogNodeMachine = createMachine({
  id: "log",
});

export class Log extends BaseNode<typeof LogNodeMachine> {
  width = 180;
  height = 150;

  static ID: "log";

  constructor(di: DiContainer, data: NodeData<typeof LogNodeMachine>) {
    super("Log", di, data, LogNodeMachine, {});

    this.addInput("exec", new ClassicPreset.Input(triggerSocket, "Exec", true));
    this.addInput("message", new ClassicPreset.Input(anySocket, "Data"));
    this.addOutput("exec", new ClassicPreset.Output(triggerSocket, "Exec"));
  }

  async execute(input: "exec", forward: (output: "exec") => void) {
    this.di.dataFlow?.reset();
    const incomers = this.di.graph.incomers(this.id);

    incomers.nodes().forEach((n) => {
      this.di.dataFlow?.fetch(n.id);
    });
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      message: string[];
    };
    console.log("inputs log", (inputs.message && inputs.message[0]) || "");
    forward("exec");
  }

  data() {
    return {};
  }

  serialize() {
    return {};
  }
}
