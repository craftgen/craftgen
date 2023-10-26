import { DiContainer } from "../types";
import { BaseNode, NodeData, ParsedNode } from "./base";
import { assign, createMachine } from "xstate";
import { numberSocket, triggerSocket } from "../sockets";
import { match, P } from "ts-pattern";
import { NumberControl } from "../controls/number";
import { Input, Output } from "../input-output";
import { SetOptional } from "type-fest";

const NumberMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcwA9kDkD2EwDoBLCAGzAGIBjACwEMA7GAbQAYBdRUAB21kOULZ6nEGkQBGAMwt8ANgCsADkXzZAFknyATOPEstAGhABPCavwB2ReK3z5FvVsmzxAX1dHUGHHnzJjXISMVHSMYKwcSCA8fAJCImIIzor44srisgCcFtpOCkamCGoW+Epasi4s2SwZUu6e6Fi4BP6BwWiwyLSo+LQAZqgATgAU8iwsAJTkXk2+rUFQESIx-ILCUYnixfhVuvJqGjXWagUSVfhamZcOFreKak4W7h4g9M3wUTM+YMu8q-EbRAAWlkpwQQMkmXwmRY0nEFiyV0UmVkWnqIC+zSIpB+URWcXWoESDzB8K0OxYqjG4nsmWs8kk6MxcwCC1+sTWCUQcMsakyzkhaQq2VJinJSgsWmKCkkNJYikZzyAA */
  id: "textNode",
  context: {
    outputs: {
      value: 0,
    },
  },
  initial: "idle",
  types: {
    events: {} as {
      type: "change";
      value: number;
    },
  },
  states: {
    idle: {
      on: {
        change: {
          target: "typing",
          actions: "updateValue",
        },
      },
    },
    typing: {
      after: {
        500: "idle",
      },
      on: {
        change: {
          target: "typing", // self-loop to reset the timer
          actions: "updateValue",
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
    super("Number", di, data, NumberMachine, {
      actions: {
        updateValue: assign({
          outputs: ({ event }) => ({
            value: event.value,
          }),
        }),
      },
    });
    const self = this;
    const state = this.actor.getSnapshot();
    this.addControl(
      "value",
      new NumberControl(state?.context?.outputs?.value || 0, {
        change(value) {
          self.actor.send({ type: "change", value });
        },
      })
    );
    this.addInput("increment", new Input(triggerSocket, "+"));
    this.addInput("decrement", new Input(triggerSocket, "-"));
    this.addInput("reset", new Input(triggerSocket, "reset"));

    this.addOutput("trigger", new Output(triggerSocket, "trigger"));
    this.addOutput("value", new Output(numberSocket, "Value"));
  }

  async execute(
    trigger: "increment" | "decrement" | "reset",
    forward: (output: "trigger") => void
  ) {
    const state = this.actor.getSnapshot();
    match(trigger)
      .with("increment", () => {
        this.actor.send({
          type: "change",
          value: state.context.outputs.value + 1,
        });
      })
      .with("decrement", () => {
        this.actor.send({
          type: "change",
          value: state.context.outputs.value - 1,
        });
      })
      .with("reset", () => {
        this.actor.send({ type: "change", value: 0 });
      });
    forward("trigger");
  }

  async data() {
    const state = this.actor.getSnapshot();
    return state.context.outputs;
  }
}
