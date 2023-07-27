import { ClassicPreset } from "rete";
import { ActionSocket } from "../sockets";
import { ButtonControl, DiContainer } from "../editor";

export class Start extends ClassicPreset.Node<
  {},
  { exec: ClassicPreset.Socket },
  {
    trigger: ButtonControl;
  }
> {
  width = 180;
  height = 120;

  private _engine?: any;

  static ID: "start";

  constructor(di: DiContainer) {
    super("Start");
    this._engine = di.engine;

    this.addOutput(
      "exec",
      new ClassicPreset.Output(new ActionSocket(), "Exec")
    );
    this.addControl(
      "trigger",
      new ButtonControl("exec", () => {
        this._engine?.execute(this.id);
        // console.log(this);
      })
    );
  }

  execute(_: any, forward: (output: "exec") => void) {
    forward("exec");
  }

  data() {
    return {};
  }

  serialize() {
    return {};
  }
}
