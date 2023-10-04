import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine } from "xstate";
import { stringSocket } from "../sockets";

const TextNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcwA9kDkD2EwDoBLCAGzAGIBjACwEMA7GAbQAYBdRUAB21kOULZ6nEGkQBGAMwt8ANgCsADkXzZAFknyATOPEstAGhABPCavwB2ReK3z5FvVsmzxAX1dHUGHHnzJjXISMVHSMYKwcSCA8fAJCImIIzor44srisgCcFtpOCkamCGoW+Epasi4s2SwZUu6e6Fi4BP6BwWiwyLSo+LQAZqgATgAU8iwsAJTkXk2+rUFQESIx-ILCUYnixfhVuvJqGjXWagUSVfhamZcOFreKak4W7h4g9M3wUTM+YMu8q-EbRAAWlkpwQQMkmXwmRY0nEFiyV0UmVkWnqIC+zSIpB+URWcXWoESDzB8K0OxYqjG4nsmWs8kk6MxcwCC1+sTWCUQcMsakyzkhaQq2VJinJSgsWmKCkkNJYikZzyAA */
  id: "textNode",
  context: {
    outputs: {
      value: "",
    },
  },
  initial: "idle",
  types: {
    events: {} as {
      type: "change";
      value: string;
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

export class TextNode extends BaseNode<typeof TextNodeMachine> {
  constructor(di: DiContainer, data: NodeData<typeof TextNodeMachine>) {
    super("TextNode", di, data, TextNodeMachine, {
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
      new ClassicPreset.InputControl("text", {
        initial: state?.context?.outputs?.value || "",
        async change(value) {
          self.actor.send({ type: "change", value });
        },
      })
    );
    this.addOutput("value", new ClassicPreset.Output(stringSocket, "Value"));
  }

  async serialize() {
    return {};
  }
}
