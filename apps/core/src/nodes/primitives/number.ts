import { merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, None, type ParsedNode } from "../base";

const inputSockets = {
  value: generateSocket({
    name: "value",
    type: "number",
    description: "Value",
    required: true,
    isMultiple: false,
    "x-showInput": false,
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
    "x-showInput": true,
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

  static parse(params: SetOptional<NumberData, "type">): NumberData {
    return {
      ...params,
      type: "Number",
    };
  }
  constructor(di: DiContainer, data: NumberData) {
    super("Number", di, data, NumberMachine, {});
    // this.addControl(
    //   "value",
    //   new NumberControl(() => this.snap.context?.outputs?.value || 0, {
    //     change: (value) => {
    //       this.actor.send({ type: "change", value });
    //     },
    //   }),
    // );
    // this.addInput("increment", new Input(triggerSocket, "+"));
    // this.addInput("decrement", new Input(triggerSocket, "-"));
    // this.addInput("reset", new Input(triggerSocket, "reset"));

    // this.addOutput("trigger", new Output(triggerSocket, "trigger"));
    // this.addOutput("value", new Output(numberSocket, "Value"));
  }
}