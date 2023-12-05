import { SetOptional } from "type-fest";
import { createMachine } from "xstate";

import { ButtonControl } from "../controls/button";
import { Output } from "../input-output";
import { triggerSocket } from "../sockets";
import { DiContainer } from "../types";
import { BaseMachineTypes, BaseNode, None, ParsedNode } from "./base";

const StartNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "startNode",
  context: ({ input }) => ({
    ...input,
    inputSockets: {
      trigger: {
        name: "trigger",
        type: "trigger",
        description: "Trigger",
        required: false,
        isMultiple: true,
        "x-showInput": false,
        "x-key": "trigger",
        "x-event": "RUN",
      },
    },
  }),
  types: {} as BaseMachineTypes<{
    events: {
      type: "RUN";
      inputs: any;
    };
    actions: None;
    actors: None;
    context: {};
    guards: None;
    input: {};
  }>,
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
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
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
  static label = "Start";
  static description = "Start node of the workflow";
  static icon = "power";

  static parse(params: SetOptional<StartNodeData, "type">): StartNodeData {
    return {
      ...params,
      type: "Start",
    };
  }

  constructor(di: DiContainer, data: StartNodeData) {
    super("Start", di, data, StartNodeMachine, {});

    this.addOutput("trigger", new Output(triggerSocket, "Exec"));
  }
}
