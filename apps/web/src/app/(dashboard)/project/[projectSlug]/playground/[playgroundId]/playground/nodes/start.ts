import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { ButtonControl } from "../ui/control/control-button";
import { BaseNode, NodeData } from "./base";
import { createMachine } from "xstate";
import { triggerSocket } from "../sockets";
import { NodeTypes } from "../types";

const StartNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "startNode",
});

export class Start extends BaseNode<typeof StartNodeMachine> {
  width = 180;
  height = 200;
  constructor(di: DiContainer, data: NodeData<typeof StartNodeMachine>) {
    super("Start", "Start", di, data, StartNodeMachine, {});

    this.addOutput("trigger", new ClassicPreset.Output(triggerSocket, "Exec"));
    this.addControl(
      "trigger",
      new ButtonControl("Execute", () => {
        // this._di?.dataFlow?.reset();
        this.di?.engine?.execute(this.id);
      })
    );
  }

  execute(_: any, forward: (output: "trigger") => void) {
    forward("trigger");
  }

  data() {
    return {};
  }

  async serialize() {
    return {};
  }
}
