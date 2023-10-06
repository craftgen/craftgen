import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine } from "xstate";
import { stringSocket } from "../sockets";
import { TextareControl } from "../controls/textarea";
import { merge } from "lodash-es";

const TextNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcwA9kDkD2EwDoBLCAGzAGIBjACwEMA7GAbQAYBdRUAB21kOULZ6nEGkQBGAMwt8ANgCsADkXzZAFknyATOPEstAGhABPCavwB2ReK3z5FvVsmzxAX1dHUGHHnzJjXISMVHSMYKwcSCA8fAJCImIIzor44srisgCcFtpOCkamCGoW+Epasi4s2SwZUu6e6Fi4BP6BwWiwyLSo+LQAZqgATgAU8iwsAJTkXk2+rUFQESIx-ILCUYnixfhVuvJqGjXWagUSVfhamZcOFreKak4W7h4g9M3wUTM+YMu8q-EbRAAWlkpwQQMkmXwmRY0nEFiyV0UmVkWnqIC+zSIpB+URWcXWoESDzB8K0OxYqjG4nsmWs8kk6MxcwCC1+sTWCUQcMsakyzkhaQq2VJinJSgsWmKCkkNJYikZzyAA */
  id: "textNode",
  context: ({ input }) =>
    merge(
      {
        value: "",
        outputs: {
          value: "",
        },
      },
      input
    ),
  initial: "complete",
  types: {} as {
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
    events: {
      type: "change";
      value: string;
    };
  },
  states: {
    typing: {
      entry: ["updateValue"],
      after: {
        200: "complete",
      },
      on: {
        change: {
          target: "typing", // self-loop to reset the timer
          reenter: true,
        },
      },
    },
    complete: {
      entry: [
        assign({
          outputs: ({ context }) => ({
            value: context.value,
          }),
        }),
      ],
      on: {
        change: {
          target: "typing",
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
          value: ({ event }) => event.value,
        }),
      },
    });
    const self = this;
    const state = this.actor.getSnapshot();
    this.addControl(
      "value",
      new TextareControl(state?.context?.outputs?.value, {
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
