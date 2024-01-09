import { merge } from "lodash-es";
import type { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { DiContainer } from "../../types";
import type { BaseMachineTypes, None} from "../base";
import { BaseNode  } from "../base";
import type {ParsedNode} from "../base";

const inputSockets = {
  value: generateSocket({
    name: "value",
    type: "number",
    description: "Value",
    required: true,
    isMultiple: false,
    "x-showSocket": false,
    "x-key": "value",
  }),
};

const outputSockets = {
  value: generateSocket({
    name: "value",
    type: "number",
    description: "Number Value",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "value",
  }),
};

const NumberMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcwA9kDkD2EwDoBLCAGzAGIBjACwEMA7GAbQAYBdRUAB21kOULZ6nEGkQBGAMwt8ANgCsADkXzZAFknyATOPEstAGhABPCavwB2ReK3z5FvVsmzxAX1dHUGHHnzJjXISMVHSMYKwcSCA8fAJCImIIzor44srisgCcFtpOCkamCGoW+Epasi4s2SwZUu6e6Fi4BP6BwWiwyLSo+LQAZqgATgAU8iwsAJTkXk2+rUFQESIx-ILCUYnixfhVuvJqGjXWagUSVfhamZcOFreKak4W7h4g9M3wUTM+YMu8q-EbRAAWlkpwQQMkmXwmRY0nEFiyV0UmVkWnqIC+zSIpB+URWcXWoESDzB8K0OxYqjG4nsmWs8kk6MxcwCC1+sTWCUQcMsakyzkhaQq2VJinJSgsWmKCkkNJYikZzyAA */
  id: "textNode",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputSockets: {
          ...inputSockets,
        },
        outputSockets: {
          ...outputSockets,
        },
        inputs: {
          value: 0,
        },
        outputs: {
          value: 0,
        },
      },
      input,
    ),
  initial: "complete",
  types: {} as BaseMachineTypes<{
    input: {
      inputs: {
        value: number;
      };
      outputs: {
        value: number;
      };
    };
    context: {
      inputs: {
        value: number;
      };
      outputs: {
        value: number;
      };
    };
    events: None;
    actions: None;
    actors: None;
    guards: None;
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
});

export type NumberData = ParsedNode<"Number", typeof NumberMachine>;
export class Number extends BaseNode<typeof NumberMachine> {
  static nodeType = "Number" as const;
  static label = "Number";
  static description = "Node for handling numbers";
  static icon = "numbers";

  static section = "Primitives";

  static parse(params: SetOptional<NumberData, "type">): NumberData {
    return {
      ...params,
      type: "Number",
    };
  }
  constructor(di: DiContainer, data: NumberData) {
    super("Number", di, data, NumberMachine, {});
    this.setup();
  }
}
