import { ClassicPreset } from "rete";
import { ActionSocket, TextSocket } from "../sockets";
import { DiContainer } from "../editor";

export class Log extends ClassicPreset.Node<
  { exec: ClassicPreset.Socket; message: ClassicPreset.Socket },
  { exec: ClassicPreset.Socket },
  {}
> {
  width = 180;
  height = 150;

  private di?: DiContainer;
  static ID: "log";

  constructor(di: DiContainer) {
    super("Log");
    this.di = di;

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
