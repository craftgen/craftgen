import { ClassicPreset } from "rete";
import { DataflowEngine } from "rete-engine";
import { Schemes } from "../types";
import { ActionSocket, TextSocket } from "../sockets";

export class Log extends ClassicPreset.Node<
  { exec: ClassicPreset.Socket; message: ClassicPreset.Socket },
  { exec: ClassicPreset.Socket },
  {}
> {
  width = 180;
  height = 150;

  public __type = "Log";

  private _dataflow?: DataflowEngine<Schemes>;

  constructor(
    private log: (text: string) => void,
    dataflow: DataflowEngine<Schemes>
  ) {
    super("Log");
    this._dataflow = dataflow;

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
    const inputs = (await this._dataflow?.fetchInputs(this.id)) as {
      message: string[];
    };
    console.log("CALLED");
    this.log((inputs.message && inputs.message[0]) || "");

    forward("exec");
  }

  data() {
    return {};
  }
}
