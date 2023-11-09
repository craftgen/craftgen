import { type DiContainer, type Node } from "../types";
import { BaseMachineTypes, BaseNode, type ParsedNode } from "./base";
import { assign, createMachine } from "xstate";
import { stringSocket } from "../sockets";
import { TextareControl } from "../controls/textarea";
import { merge } from "lodash-es";
import { Output } from "../input-output";
import { SetOptional } from "type-fest";
import { match } from "ts-pattern";

const TextNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcwA9kDkD2EwDoBLCAGzAGIBjACwEMA7GAbQAYBdRUAB21kOULZ6nEGkQBGAMwt8ANgCsADkXzZAFknyATOPEstAGhABPCavwB2ReK3z5FvVsmzxAX1dHUGHHnzJjXISMVHSMYKwcSCA8fAJCImIIzor44srisgCcFtpOCkamCGoW+Epasi4s2SwZUu6e6Fi4BP6BwWiwyLSo+LQAZqgATgAU8iwsAJTkXk2+rUFQESIx-ILCUYnixfhVuvJqGjXWagUSVfhamZcOFreKak4W7h4g9M3wUTM+YMu8q-EbRAAWlkpwQQMkmXwmRY0nEFiyV0UmVkWnqIC+zSIpB+URWcXWoESDzB8K0OxYqjG4nsmWs8kk6MxcwCC1+sTWCUQcMsakyzkhaQq2VJinJSgsWmKCkkNJYikZzyAA */
  id: "textNode",
  context: ({ input }) =>
    merge(
      {
        inputs: {},
        inputSockets: [],
        value: "",
        outputSockets:[],
        outputs: {
          value: "",
        },
        error: null,
      },
      input
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
    events: {
      type: "change";
      value: string;
    };
    actions: {
      type: "updateValue";
      params?: {
        value: string;
      };
    };
  }>,
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
      // type: "final",
      output: ({ context }) => context.outputs,
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
  output: ({ context }) => context.outputs, 
});

export type TextNodeData = ParsedNode<"TextNode", typeof TextNodeMachine>;

export class TextNode extends BaseNode<typeof TextNodeMachine> {
  static nodeType = "TextNode" as const;
  static label = "Text";
  static description = "Node for handling static text";
  static icon = "text";

  static parse(params: SetOptional<TextNodeData, "type">): TextNodeData {
    return {
      ...params,
      type: "TextNode",
    };
  }
  // static machine = TextNodeMachine;

  constructor(di: DiContainer, data: TextNodeData) {
    super("TextNode", di, data, TextNodeMachine, {
      actions: {
        updateValue: assign({
          value: ({ event }) => 
             match(event)
              .with({ type: "change" }, ({ value }) => {
                return value;
              })
              .run()
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
    this.addOutput("value", new Output(stringSocket, "Value"));
  }
}
