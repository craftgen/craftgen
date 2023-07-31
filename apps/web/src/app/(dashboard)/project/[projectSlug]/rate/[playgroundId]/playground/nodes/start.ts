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

  private _di?: DiContainer;

  static ID: "start";

  constructor(di: DiContainer) {
    super("Start");
    this._di = di;

    this.addOutput(
      "exec",
      new ClassicPreset.Output(new ActionSocket(), "Exec")
    );
    this.addControl(
      "trigger",
      new ButtonControl("exec", () => {
        this._di?.dataFlow?.reset();
        this._di?.engine?.execute(this.id);
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
