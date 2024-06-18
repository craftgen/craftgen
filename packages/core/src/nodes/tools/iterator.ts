import { get, merge } from "lodash-es";
import type { SetOptional } from "type-fest";
import { assign, createMachine, enqueueActions } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { DiContainer } from "../../types";
import {
  BaseNode,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "../base";

export const IteratorNodeMachine = createMachine({
  id: "IteratorNode",
  context: ({ input }) =>
    merge<Partial<typeof input>, any>(
      {
        inputs: {
          index: 0,
          source: [],
        },
        inputSockets: {
          source: generateSocket({
            name: "source",
            type: "array",
            description: "Source array",
            required: true,
            isMultiple: false,
            "x-showSocket": true,
            default: [],
            "x-key": "source",
          }),
          index: generateSocket({
            name: "index",
            type: "number",
            description: "Index",
            required: true,
            isMultiple: false,
            "x-showSocket": false,
            default: 0,
            "x-key": "index",
          }),
          NEXT: generateSocket({
            name: "Next",
            type: "trigger",
            description: "iterate to next item",
            required: true,
            isMultiple: true,
            "x-showSocket": true,
            "x-key": "NEXT",
            "x-event": "NEXT",
          }),
          PREV: generateSocket({
            name: "Prev",
            type: "trigger",
            description: "iterate to prev item",
            required: true,
            isMultiple: true,
            "x-showSocket": false,
            "x-key": "PREV",
            "x-event": "PREV",
          }),
          RESET: generateSocket({
            name: "Reset",
            type: "trigger",
            description: "reset to first item",
            required: true,
            isMultiple: true,
            "x-showSocket": false,
            "x-key": "RESET",
            "x-event": "RESET",
          }),
        },
        outputSockets: {
          Iterator: generateSocket({
            name: "Iterator",
            type: "IteratorNode",
            description: "Iterator Node instance",
            required: false,
            isMultiple: true,
            "x-showSocket": true,
            "x-key": "Iterator",
          }),
          value: generateSocket({
            name: "value",
            type: "any",
            description: "Value",
            required: true,
            isMultiple: true,
            "x-showSocket": true,
            "x-key": "value",
          }),
          index: generateSocket({
            name: "index",
            type: "number",
            description: "Index",
            required: true,
            isMultiple: true,
            "x-key": "index",
          }),
        },
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    context: {
      inputs: {
        index: number;
        source: any[];
      };
    };
    actions:
      | {
          type: "resetIndex";
        }
      | {
          type: "incrementIndex";
        }
      | {
          type: "decrementIndex";
        }
      | {
          type: "setOutputs";
        };
    events:
      | {
          type: "NEXT";
        }
      | {
          type: "PREV";
        }
      | {
          type: "RESET";
        };
    guards:
      | {
          type: "isComplete";
        }
      | {
          type: "isFirst";
        }
      | {
          type: "isProgress";
        }
      | {
          type: "hasNext";
        };
    actors: None;
    input: {
      inputs: {
        index: number;
        source: any[];
      };
    };
  }>,
  initial: "idle",
  states: {
    idle: {
      entry: ["setOutputs"],
      always: [
        {
          target: "complete",
          guard: "isComplete",
        },
        {
          target: "progress",
          guard: "isProgress",
        },
      ],
      on: {
        SET_VALUE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("setValue");
            enqueue("setOutputs");
          }),
        },
        NEXT: {
          actions: "incrementIndex",
          guard: "hasNext",
          target: "progress",
        },
      },
    },
    progress: {
      entry: ["setOutputs"],
      always: [
        {
          target: "complete",
          guard: "isComplete",
        },
        {
          target: "idle",
          guard: "isFirst",
        },
      ],
      on: {
        SET_VALUE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("setValue");
            enqueue("setOutputs");
          }),
        },
        PREV: {
          actions: ["decrementIndex", "setOutputs"],
          reenter: true,
        },
        NEXT: {
          actions: ["incrementIndex", "setOutputs"],
          guard: "hasNext",
          reenter: true,
        },
        RESET: {
          target: "idle",
          actions: ["resetIndex"],
        },
      },
    },
    complete: {
      entry: ["setOutputs"],
      on: {
        SET_VALUE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("setValue");
            enqueue("setOutputs");
          }),
        },
        PREV: {
          target: "progress",
          actions: ["decrementIndex"],
        },
        RESET: {
          target: "idle",
          actions: ["resetIndex"],
        },
      },
    },
  },
});

export type IteratorNodeData = ParsedNode<
  "IteratorNode",
  typeof IteratorNodeMachine
>;

export class IteratorNode extends BaseNode<typeof IteratorNodeMachine> {
  static nodeType = "IteratorNode" as const;
  static label = "Iterator";
  static description = "Node for iterating over a list";
  static icon = "brackets";

  static section = "Tools";

  static parse(
    params: SetOptional<IteratorNodeData, "type">,
  ): IteratorNodeData {
    return {
      ...params,
      type: "IteratorNode",
    };
  }

  static machines = {
    NodeIterator: IteratorNodeMachine,
  };

  constructor(di: DiContainer, data: IteratorNodeData) {
    super("IteratorNode", di, data, IteratorNodeMachine, {
      actions: {
        incrementIndex: assign({
          inputs: ({ context }) => ({
            ...context.inputs,
            index: Math.min(
              context.inputs.index + 1,
              context.inputs.source.length,
            ),
          }),
        }),
        decrementIndex: assign({
          inputs: ({ context }) => ({
            ...context.inputs,
            index: Math.max(context.inputs.index - 1, 0),
          }),
        }),
        resetIndex: assign({
          inputs: ({ context }) => ({
            ...context.inputs,
            index: 0,
          }),
        }),
        setOutputs: assign({
          outputs: ({ context }) => {
            const value = get(
              context.inputs.source,
              context.inputs.index,
              undefined,
            );
            return {
              value,
              index: context.inputs.index,
            };
          },
        }),
      },
      guards: {
        isComplete: ({ context }) => {
          return context.inputs.index >= context.inputs.source.length - 1;
        },
        hasNext: ({ context }) => {
          return context.inputs.index < context.inputs.source.length - 1;
        },
        isFirst: ({ context }) => {
          return context.inputs.index === 0;
        },
        isProgress: ({ context }) => {
          return (
            context.inputs.index > 0 &&
            context.inputs.index < context.inputs.source.length - 1
          );
        },
      },
    });
  }
}
