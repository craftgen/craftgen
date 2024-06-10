import { get, merge } from "lodash-es";
import type { SetOptional } from "type-fest";
import { createMachine, enqueueActions } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { DiContainer } from "../../types";
import {
  BaseNode,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "../base";

const outputSockets = {
  TRUE: generateSocket({
    name: "True",
    type: "trigger",
    description: "Branch to true",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "TRUE",
    "x-event": "TRUE",
  }),
  FALSE: generateSocket({
    name: "False",
    type: "trigger",
    description: "Branch to false",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "FALSE",
    "x-event": "FALSE",
  }),
};

const inputSockets = {
  RUN: generateSocket({
    name: "Run",
    type: "trigger",
    description: "Run",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "RUN",
    "x-event": "RUN",
  }),
  condition: generateSocket({
    name: "Condition",
    type: "boolean",
    description: "Condition",
    required: true,
    isMultiple: false,
    "x-showSocket": false,
    default: false,
    "x-key": "condition",
  }),
};

export const BranchNodeMachine = createMachine({
  id: "BranchNode",
  context: ({ input }) =>
    merge<Partial<typeof input>, any>(
      {
        inputs: {
          condition: true,
        },
        inputSockets,
        outputSockets,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    context: {};
    input: {
      inputs: {
        condition: boolean;
      };
    };
    actions: None;
    actors: None;
    guards: None;
    events: None;
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        SET_VALUE: {
          actions: ["setValue"],
        },
        RUN: {
          actions: enqueueActions(({ enqueue, check }) => {
            if (check(({ context }) => context.inputs.condition)) {
              enqueue({
                type: "triggerSuccessors",
                params: {
                  port: "TRUE",
                },
              });
            } else {
              enqueue({
                type: "triggerSuccessors",
                params: {
                  port: "FALSE",
                },
              });
            }
          }),
        },
      },
    },
  },
});

export type BranchNodeData = ParsedNode<"BranchNode", typeof BranchNodeMachine>;

export class BranchNode extends BaseNode<typeof BranchNodeMachine> {
  static nodeType = "BranchNode" as const;
  static label = "Branch";
  static description = "Branches the flow of execution based on a condition";
  static icon = "split";

  static section = "Tools";

  static machines = {
    NodeBranch: BranchNodeMachine,
  };

  static parse(params: SetOptional<BranchNodeData, "type">): BranchNodeData {
    return {
      ...params,
      type: "BranchNode",
    };
  }

  constructor(di: DiContainer, data: BranchNodeData) {
    super("BranchNode", di, data, BranchNodeMachine, {});
  }
}
