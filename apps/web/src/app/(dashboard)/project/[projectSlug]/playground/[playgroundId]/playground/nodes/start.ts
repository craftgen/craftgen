import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { ButtonControl } from "../ui/control/control-button";
import { BaseNode, NodeData } from "./base";
import { createMachine } from "xstate";
import { triggerSocket } from "../sockets";

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

  constructor(di: DiContainer, data: NodeData<typeof StartNodeMachine>) {
    console.log('aa', di, data);
    super("Start", di, data, StartNodeMachine, {});

    this.addOutput(
      "exec",
      new ClassicPreset.Output(triggerSocket, "Exec")
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

  async serialize() {
    return {};
  }
}
