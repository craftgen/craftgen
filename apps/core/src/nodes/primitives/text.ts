import { merge } from "lodash-es";
import type { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { DiContainer, Node } from "../../types";
import type { BaseMachineTypes, None } from "../base";
import { BaseNode } from "../base";
import type { ParsedNode } from "../base";

const inputSockets = {
  value: generateSocket({
    name: "value",
    type: "string",
    description: "Text",
    required: false,
    isMultiple: false,
    "x-showSocket": false,
    "x-key": "value",
    "x-controller": "textarea",
  }),
};

const outputSockets = {
  value: generateSocket({
    name: "value",
    type: "string",
    description: "Result text",
    required: true,
    isMultiple: false,
    "x-showSocket": true,
    "x-key": "value",
    "x-controller": "textarea",
  }),
};

const TextNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcwA9kDkD2EwDpkBPABwEsA7KAYgGUBRAFQH0A1AQQBkBVegbQAMAXUSgS2WGWRlsFUSCKIAjAA4ATPgCsKgOxqALDoBsmgMxLNAlaYA0INIktL8agJxG1pla9VGjrnQBfQLtUDBw8QlJKGjRYZABDVHwEgDNUACcACjUBAQBKajCsXAJicipBESQQcUlpWXkHBCcXd09vX38dO0UEJVN9LV0DYzMLK1Ng0PQSyIBjbABbEgAbMFQ6JjYuXir5OqkZORrmtSNTfFNXG9yBVxUVASVXfV7EcwF8C7NNHU1XGolAITMEQiAKKV4DVihEwAcJEdGqdEABafQqd4IQz4Kx6UxGdQGVxeILg2GlKIVKAI+rHJofZ74HT6EkXHwqPwBLGqDTaPSGEzmSzWaYgCkLZZrDbwmqHBonUDNARY8w6XEjQXjEVgwJAA */
  id: "textNode",
  context: ({ input }) =>
    merge(
      {
        inputs: {
          value: "",
        },
        inputSockets: {
          ...inputSockets,
        },
        outputSockets: {
          ...outputSockets,
        },
        outputs: {
          value: "",
        },
        error: null,
      },
      input,
    ),
  initial: "complete",
  types: {} as BaseMachineTypes<{
    input: {
      value: string;
      outputs: {
        value: string;
      };
    };
    context: {
      value: string;
      outputs: {
        value: string;
      };
    };
    actors: None;
    actions: None;
    guards: None;
    events: None;
  }>,
  states: {
    typing: {
      after: {
        10: "complete",
      },
      on: {
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        SET_VALUE: {
          target: "typing",
          reenter: true,
          actions: ["setValue"],
        },
      },
    },
    complete: {
      // type: "final",
      output: ({ context }) => context.outputs,
      entry: [
        assign({
          outputs: ({ context }) => ({
            value: context.inputs.value,
          }),
        }),
      ],
      on: {
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        SET_VALUE: {
          target: "typing",
          actions: ["setValue"],
        },
      },
    },
  },
  output: ({ context }) => context.outputs,
});

export type TextNodeData = ParsedNode<"TextNode", typeof TextNodeMachine>;

export class TextNode extends BaseNode<typeof TextNodeMachine> {
  static nodeType = "TextNode" as const;
  static label = "Text";
  static description = "Node for handling static text";
  static icon = "text";

  static section = "Primitives";

  static parse(params: SetOptional<TextNodeData, "type">): TextNodeData {
    return {
      ...params,
      type: "TextNode",
    };
  }

  static machines = {
    NodeText: TextNodeMachine,
  };

  constructor(di: DiContainer, data: TextNodeData) {
    super("TextNode", di, data, TextNodeMachine, {});
    this.setup();
  }
}
