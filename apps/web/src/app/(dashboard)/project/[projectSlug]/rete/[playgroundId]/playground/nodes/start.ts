import { ClassicPreset } from "rete";
import { ActionSocket } from "../sockets";
import { DiContainer } from "../editor";
import { ButtonControl } from "../ui/control/control-button";
import { BaseNode, NodeData } from "./base";
import { createMachine } from "xstate";

const StartNodeMachine = createMachine({
  id: "startNode",
});

export class Start extends BaseNode<
  typeof StartNodeMachine,
  {},
  { exec: ClassicPreset.Socket },
  {
    trigger: ButtonControl;
  }
> {
  width = 180;
  height = 200;

  static ID: "start";

  constructor(di: DiContainer, data: NodeData) {
    console.log(di, data);
    super("Start", di, data, StartNodeMachine, {});

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
