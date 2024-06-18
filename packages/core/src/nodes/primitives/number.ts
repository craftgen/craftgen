import { merge, set } from "lodash-es";
import type { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { spawnInputSockets } from "../../input-socket";
import { spawnOutputSockets } from "../../output-socket";
import type { DiContainer } from "../../types";
import {
  BaseNode,
  NodeContextFactory,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "../base";

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
  id: "numberNode",
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "Text",
      description: "Text value",
      inputSockets,
      outputSockets,
    }),
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
        SET_VALUE: {
          target: "typing",
          actions: ["setValue"],
        },
      },
    },
  },
});

export type NumberData = ParsedNode<"NodeNumber", typeof NumberMachine>;
export class NodeNumber extends BaseNode<typeof NumberMachine> {
  static nodeType = "NodeNumber";
  static label = "Number";
  static description = "Node for handling numbers";
  static icon = "numbers";

  static section = "Primitives";

  static parse(params: SetOptional<NumberData, "type">): NumberData {
    return {
      ...params,
      type: "NodeNumber",
    };
  }

  static machines = {
    NodeNumber: NumberMachine,
  };

  constructor(di: DiContainer, data: NumberData) {
    super("NodeNumber", di, data, NumberMachine, {});
  }
}
