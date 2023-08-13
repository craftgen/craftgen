import { ClassicPreset } from "rete";
import { ActionSocket, TextSocket } from "../sockets";
import { DiContainer } from "../editor";
import { BaseNode, NodeData } from "./base";
import { createMachine } from "xstate";

const LogNodeMachine = createMachine({
  id: "log",
});

export class Log extends BaseNode<
  typeof LogNodeMachine,
  { exec: ClassicPreset.Socket; message: ClassicPreset.Socket },
  { exec: ClassicPreset.Socket },
  {}
> {
  width = 180;
  height = 150;

  static ID: "log";

  constructor(di: DiContainer, data: NodeData) {
    super("Log", di, data, LogNodeMachine, {});

    this.addInput(
      "exec",
      new ClassicPreset.Input(new ActionSocket(), "Exec", true)
    );
    this.addInput("message", new ClassicPreset.Input(new TextSocket(), "Text"));
    this.addOutput(
      "exec",
      new ClassicPreset.Output(new ActionSocket(), "Exec")
    );
  }

  async execute(input: "exec", forward: (output: "exec") => void) {
    this.di.dataFlow?.reset();
    this.di.editor.getNodes().forEach((n) => {
      this.di.dataFlow?.fetch(n.id);
    });
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      message: string[];
    };
    console.log((inputs.message && inputs.message[0]) || "");

    forward("exec");
  }

  data() {
    return {};
  }

  public delete() {
    this.di?.editor.removeNode(this.id);
  }

  serialize() {
    return {};
  }
}
