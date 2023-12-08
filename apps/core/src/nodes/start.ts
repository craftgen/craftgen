import { merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { createMachine } from "xstate";

import { generateSocket } from "../controls/socket-generator";
import { DiContainer } from "../types";
import { BaseMachineTypes, BaseNode, None, ParsedNode } from "./base";

const StartNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "startNode",
  context: ({ input }) =>
    merge<Partial<typeof input>, any>(
      {
        ...input,
        inputSockets: {
          trigger: generateSocket({
            name: "trigger",
            type: "trigger",
            description: "Trigger",
            required: false,
            isMultiple: true,
            "x-showSocket": false,
            "x-key": "trigger",
            "x-event": "RUN",
          }),
        },
        outputSockets: {
          trigger: generateSocket({
            name: "trigger",
            type: "trigger",
            description: "Trigger",
            required: false,
            isMultiple: true,
            "x-showSocket": true,
            "x-key": "trigger",
            "x-event": "RUN",
          }),
        },
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    events: None;
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
        },
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
      },
    },
    complete: {
      entry: ["triggerSuccessors"],
      always: {
        target: "idle",
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
  }
}
