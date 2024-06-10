import type { SetOptional } from "type-fest";
import { createMachine, enqueueActions } from "xstate";

import { generateSocket } from "../controls/socket-generator";
import type { DiContainer } from "../types";
import {
  BaseNode,
  NodeContextFactory,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "./base";

const StartNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "startNode",
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "Ollama Model",
      description: "Ollama Model configuration",
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
    }),
  types: {} as BaseMachineTypes<{
    events: None;
    actions: None;
    actors: None;
    context: {};
    guards: None;
    input: {};
  }>,
  initial: "idle",
  on: {
    ASSIGN_CHILD: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("assignChild");
      }),
    },
    INITIALIZE: {
      actions: ["initialize"],
    },
  },
  states: {
    idle: {
      on: {
        RUN: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue({
              type: "triggerSuccessors",
              params: {
                port: "trigger",
              },
            });
          }),
        },
      },
    },
  },
});

export type StartNodeData = ParsedNode<"NodeStart", typeof StartNodeMachine>;

export class NodeStart extends BaseNode<typeof StartNodeMachine> {
  static nodeType = "NodeStart" as const;
  static label = "Start";
  static description = "Start node of the workflow";
  static icon = "power";

  static parse(params: SetOptional<StartNodeData, "type">): StartNodeData {
    return {
      ...params,
      type: "NodeStart",
    };
  }

  static machines = {
    NodeStart: StartNodeMachine,
  };

  constructor(di: DiContainer, data: StartNodeData) {
    super("NodeStart", di, data, StartNodeMachine, {});
  }
}
