import { merge } from "lodash-es";
import { autorun, reaction } from "mobx";
import { SetOptional } from "type-fest";
import { assign, createMachine, EventDescriptor, EventFrom } from "xstate";

import { ButtonControl } from "../../controls/button";
import { NumberControl } from "../../controls/number";
import { Input } from "../../input-output";
import { numberSocket, triggerSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, None, ParsedNode } from "../base";

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
          source: {
            name: "source",
            type: "array",
            description: "Source array",
            required: true,
            isMultiple: false,
            default: [],
          },
          index: {
            name: "index",
            type: "number",
            description: "Index",
            required: true,
            isMultiple: false,
            "x-showInput": false,
            default: 0,
          },
          NEXT: {
            name: "NEXT",
            type: "tool",
            description: "iterate to next item",
            required: true,
            isMultiple: true,
            "x-showInput": true,
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
          actions: ["setValue"],
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
          actions: ["setValue"],
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
          actions: ["setValue"],
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
          outputs: ({ context }) => ({
            value: context.inputs.source[context.inputs.index],
            index: context.inputs.index,
          }),
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

    const nextEvents = this.snap.getNextEvents();
    this.setupControls(nextEvents);

    reaction(
      () => this.snap.getNextEvents(),
      async (events) => {
        console.log("events", events);
        this.setupControls(events);
      },
    );

    // const input = new Input(triggerSocket, "inc", true, true);
    // input.addControl(
    //   new ButtonControl(
    //     "Inc",
    //     () =>
    //       this.actor.send({
    //         type: "NEXT",
    //       }),
    //     {
    //       disabled: !this.snap.getNextEvents().includes("NEXT"),
    //     },
    //   ),
    // );
    // this.addInput("NEXT", input);

    // console.log("CHILD", this.snap);
    // const ggg = new NumberControl(() => this.snap.context.inputs.index, {
    //   change: (value) => {
    //     console.log("change", value);
    //     this.actor.send({
    //       type: "SET_VALUE",
    //       values: {
    //         index: value,
    //       },
    //     });
    //   },
    // });
    // const dd = new Input(numberSocket, "nnn", true, true);
    // numberSocket.definition = {
    //   title: "DD",
    //   description: "DDDD",
    // };

    // dd.addControl(ggg);

    // this.addInput("nnn", dd);
  }

  private setupControls(
    events: ReadonlyArray<
      EventDescriptor<EventFrom<typeof IteratorNodeMachine>>
    >,
  ): void {
    if (events.includes("NEXT")) {
      !this.hasControl("inc") &&
        this.addControl(
          "inc",
          new ButtonControl("Inc", () => {
            this.actor.send({
              type: "NEXT",
            });
          }),
        );
    } else {
      this.removeControl("inc");
    }
    if (events.includes("PREV")) {
      !this.hasControl("dec") &&
        this.addControl(
          "dec",
          new ButtonControl("Dec", () => {
            this.actor.send({
              type: "PREV",
            });
          }),
        );
    } else {
      this.removeControl("dec");
    }
    if (events.includes("RESET")) {
      !this.hasControl("reset") &&
        this.addControl(
          "reset",
          new ButtonControl("Reset", () => {
            this.actor.send({
              type: "RESET",
            });
          }),
        );
    } else {
      this.removeControl("reset");
    }
  }
}
