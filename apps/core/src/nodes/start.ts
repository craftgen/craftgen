import { DiContainer } from "../editor";
import { BaseNode, NodeData, ParsedNode } from "../nodes/base";
import { createMachine } from "xstate";
import { triggerSocket } from "../sockets";
import { ButtonControl } from "../controls/button";
import { Output } from "../input-output";
import { SetOptional } from "type-fest";

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

export type StartNodeData = ParsedNode<"Start", typeof StartNodeMachine>;

export class Start extends BaseNode<typeof StartNodeMachine> {
  static nodeType = "Start" as const;
  static parse(params: SetOptional<StartNodeData, "type">): StartNodeData {
    return {
      ...params,
      type: "Start",
    };
  }

  constructor(di: DiContainer, data: StartNodeData) {
    super("Start", di, data, StartNodeMachine, {});

    this.addOutput("trigger", new Output(triggerSocket, "Exec"));
    this.addControl(
      "trigger",
      new ButtonControl("Execute", () => {
        this.di?.engine?.execute(this.id);
      })
    );
  }
}
