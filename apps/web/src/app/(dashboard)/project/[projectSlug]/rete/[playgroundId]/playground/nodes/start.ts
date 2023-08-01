import { ClassicPreset } from "rete";
import { ActionSocket } from "../sockets";
import { DiContainer } from "../editor";
import { ButtonControl } from "../ui/control/control-button";

export class Start extends ClassicPreset.Node<
  {},
  { exec: ClassicPreset.Socket },
  {
    trigger: ButtonControl;
  }
> {
  width = 180;
  height = 200;

  private di?: DiContainer;

  static ID: "start";

  constructor(di: DiContainer) {
    super("Start");
    this.di = di;

    this.addOutput(
      "exec",
      new ClassicPreset.Output(new ActionSocket(), "Exec")
    );
    this.addControl(
      "trigger",
      new ButtonControl("Execute", () => {
        // this._di?.dataFlow?.reset();
        this.di?.engine?.execute(this.id);
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
