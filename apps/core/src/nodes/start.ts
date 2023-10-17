import { DiContainer } from "../editor";
import { BaseNode, NodeData } from "../nodes/base";
import { createMachine } from "xstate";
import { triggerSocket } from "../sockets";
import { ButtonControl } from "../controls/button";
import { Output } from "../input-output";

const StartNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "startNode",
  types: {} as {
    events: {
      type: "RUN";
      inputs: any;
    };
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        RUN: {
          target: "complete",
          actions: () => {
            console.log("RUNNING");
          },
        },
      },
    },
    complete: {
      type: "final",
      output: () => {
        timestamp: Date.now();
      },
    },
  },
  output: () => {
    timestamp: Date.now();
  },
});

// type StartNodeType = BaseNode<
//   typeof StartNodeMachine,
//   {
//     trigger: typeof triggerSocket;
//     doc: typeof stringSocket;
//   },
//   {
//     trigger: typeof triggerSocket;
//     another: typeof triggerSocket;
//   }
// >;

export class Start extends BaseNode<typeof StartNodeMachine> {
  width = 180;
  height = 200;
  constructor(di: DiContainer, data: NodeData<typeof StartNodeMachine>) {
    super("Start", di, data, StartNodeMachine, {});

    this.addOutput("trigger", new Output(triggerSocket, "Exec"));
    this.addControl(
      "trigger",
      new ButtonControl("Execute", () => {
        this.di?.engine?.execute(this.id);
      })
    );
  }

  async serialize() {
    return {};
  }
}
