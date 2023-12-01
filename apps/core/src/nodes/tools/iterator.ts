import { merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, None, ParsedNode } from "../base";

export const IteratorNodeMachine = createMachine({
  id: "IteratorNode",
  context: ({ input }) =>
    merge<Partial<typeof input>, any>(
      {
        inputs: {
          source: [],
        },
        settings: {
          index: 0,
        },
        inputSockets: {
          source: {
            name: "source",
            type: "array",
            description: "Source array",
            required: true,
            isMultiple: false,
            default: [],
          },
        },
        outputSockets: {
          value: {
            name: "value",
            type: "any",
            description: "Value",
            required: true,
            isMultiple: true,
          },
          index: {
            name: "index",
            type: "number",
            description: "Index",
            required: true,
            isMultiple: true,
          },
        },
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    context: {
      settings: {
        index: number;
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
        };
    actors: None;
    input: {
      settings: {
        index: number;
      };
    };
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        NEXT: {
          actions: "incrementIndex",
          target: "progress",
        },
      },
    },
    progress: {
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
        PREV: {
          actions: "decrementIndex",
        },
        NEXT: {
          actions: "incrementIndex",
        },
        RESET: {
          target: "idle",
          actions: ["resetIndex"],
        },
      },
    },
    complete: {
      on: {
        PREV: {
          target: "progress",
          actions: ["decrementIndex"],
        },
        RESET: {
          target: "idle",
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

  constructor(di: DiContainer, data: IteratorNodeData) {
    super("IteratorNode", di, data, IteratorNodeMachine, {
      actions: {
        incrementIndex: assign({
          settings: ({ context }) => ({
            index: Math.min(
              context.settings.index + 1,
              context.inputs.source.length,
            ),
          }),
        }),
        decrementIndex: assign({
          settings: ({ context }) => ({
            index: Math.max(context.settings.index - 1, 0),
          }),
        }),
        resetIndex: assign({
          settings: ({ context }) => ({
            index: 0,
          }),
        }),
      },
      guards: {
        isComplete: ({ context }) => {
          return context.settings.index >= context.inputs.source.length;
        },
        isFirst: ({ context }) => {
          return context.settings.index === 0;
        },
      },
    });
  }
}
