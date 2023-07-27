import { ClassicPreset } from "rete";
import { ActionSocket } from "../sockets";
import { ButtonControl } from "../editor";

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

  __type = "Start";


  constructor(engine?: any) {
    super("Start");
    this._engine = engine;
    this.addOutput(
      "exec",
      new ClassicPreset.Output(new ActionSocket(), "Exec")
    );
    this.addControl(
      "trigger",
      new ButtonControl("exec", () => {
        engine?.execute(this.id);
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
}
