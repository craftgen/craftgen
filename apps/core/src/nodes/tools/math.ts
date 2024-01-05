import { createId } from "@paralleldrive/cuid2";
import { isNil, merge } from "lodash-es";
import * as mathjs from "mathjs";
import dedent from "ts-dedent";
import { SetOptional } from "type-fest";
import {
  ActorRefFrom,
  AnyActorRef,
  assertEvent,
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
} from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { DiContainer } from "../../types";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  None,
  ParsedNode,
} from "../base";

const inputSockets = {
  RUN: generateSocket({
    name: "Run",
    type: "trigger",
    description: "Run",
    required: false,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "RUN",
    "x-event": "RUN",
  }),
  expression: generateSocket({
    name: "Expression",
    type: "string",
    description: "Expression",
    required: true,
    isMultiple: false,
    default: "",
    "x-showSocket": true,
    "x-key": "expression",
  }),
};
const outputSockets = {
  onDone: generateSocket({
    name: "onDone",
    type: "trigger",
    description: "On Done",
    required: false,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "onDone",
    "x-event": "DONE",
  }),
  result: generateSocket({
    name: "Result",
    type: "number",
    description: "Result",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "result",
  }),
  Math: generateSocket({
    name: "Math",
    type: "MathNode",
    description: "Math",
    required: false,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "Math",
  }),
};

const RunMathMachine = setup({
  types: {} as {
    input: {
      inputs: {
        expression: string;
      };
      sender: ActorRefFrom<typeof MathNodeMachine>;
    };
    context: {
      inputs: {
        expression: string;
      };
      outputs: {
        result?: any;
      };
      sender?: ActorRefFrom<typeof MathNodeMachine>;
    };
  },
  actors: {
    Run: fromPromise(
      async ({
        input,
      }: {
        input: {
          expression: string;
        };
      }) => {
        const { expression } = input;
        return mathjs.evaluate(expression);
      },
    ),
  },
}).createMachine({
  id: "RunMath",
  context: ({ input }) => {
    return merge(
      {
        outputs: {
          result: undefined,
        },
      },
      input,
    );
  },
  initial: "running",
  states: {
    running: {
      invoke: {
        src: "Run",
        input: ({ context }) => ({
          expression: context.inputs.expression,
        }),
        onError: {
          target: "complete",
          actions: enqueueActions(
            ({ enqueue, check, context, event, self }) => {
              console.log("==> onError ", context, event);
              enqueue.sendTo(
                ({ context }) => context.sender,
                ({ context }) => ({
                  type: "TOOL_RESULT",
                  params: {
                    id: self.id,
                    res: {
                      result: event.error,
                      ok: false,
                    },
                  },
                }),
              );
            },
          ),
        },
        onDone: {
          target: "complete",
          actions: enqueueActions(
            ({ enqueue, check, self, event, context }) => {
              console.log("==> onDone ", context, event);
              enqueue.assign({
                outputs: ({ event }) => ({
                  result: event.output,
                  ok: true,
                }),
              });
              enqueue.sendTo(
                ({ context }) => context.sender,
                ({ context }) => ({
                  type: "TOOL_RESULT",
                  params: {
                    id: self.id,
                    res: context.outputs,
                  },
                }),
              );
            },
          ),
        },
      },
    },
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
    },
  },
  output: ({ context }) => context.outputs,
});

export const MathNodeMachine = createMachine(
  {
    id: "MathNode",
    context: ({ input }) => {
      const defaultInputs: (typeof input)["inputs"] = {};
      for (const [key, socket] of Object.entries(inputSockets)) {
        if (socket.default) {
          defaultInputs[key as any] = socket.default;
        } else {
          defaultInputs[key as any] = undefined;
        }
      }

      return merge<Partial<typeof input>, any>(
        {
          inputs: {
            ...defaultInputs,
          },
          inputSockets: {
            ...inputSockets,
          },
          outputSockets: {
            ...outputSockets,
          },
          outputs: {
            result: null,
          },
        },
        input,
      );
    },
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets>;
      context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
        parent?: {
          id: string; // Call ID.
          ref: AnyActorRef;
        };
      };
      actions: None;
      actors: {
        src: "Run";
        logic: typeof RunMathMachine;
      };
      guards: None;
      events: {
        type: "TOOL_RESULT";
        params: {
          id: string; // Call ID.
          res: {
            result: any;
            ok: boolean;
          };
        };
      };
    }>,
    initial: "idle",
    states: {
      idle: {
        on: {
          TOOL_RESULT: {
            actions: enqueueActions(({ enqueue, check, self, event }) => {
              console.log("TOOL_RESULT", event);
              assertEvent(event, "TOOL_RESULT");
              enqueue.assign({
                outputs: ({ context, event }) => ({
                  ...context.outputs,
                  result: event.params.res.result,
                }),
              });
            }),
          },
          RUN: {
            // target: "running",
            actions: enqueueActions(
              ({ enqueue, check, event, self, context }) => {
                if (
                  check(({ event }) => {
                    return !isNil(event.params?.values);
                  })
                ) {
                  enqueue({
                    type: "setValue",
                    params: {
                      values: event.params?.values!,
                    },
                  });
                }
                if (check(({ event }) => !isNil(event.params))) {
                  enqueue.spawnChild("Run", {
                    id: event.params?.executionNodeId,
                    input: {
                      inputs: {
                        expression: event.params?.values?.expression,
                      },
                      sender: event.params?.sender,
                    },
                    syncSnapshot: true,
                  });
                } else {
                  enqueue.spawnChild("Run", {
                    id: `call-${createId()}`,
                    input: {
                      inputs: {
                        expression: context?.inputs.expression,
                      },
                      sender: self,
                    },
                    syncSnapshot: true,
                  });
                }
              },
            ),
          },
          SET_VALUE: {
            actions: ["setValue"],
          },
          UPDATE_SOCKET: {
            actions: ["updateSocket"],
          },
        },
      },
      complete: {
        on: {
          SET_VALUE: {
            actions: ["setValue"],
            target: "idle",
          },
          UPDATE_SOCKET: {
            actions: ["updateSocket"],
          },
        },
      },
      error: {},
    },
  },
  {
    actors: {
      Run: RunMathMachine,
    },
  },
);

export type MathNodeData = ParsedNode<"MathNode", typeof MathNodeMachine>;

export class MathNode extends BaseNode<typeof MathNodeMachine> {
  static nodeType = "MathNode" as const;
  static label = "Math";
  static description = dedent`
    A tool for evaluating mathematical expressions. Example expressions:
    '1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.
  `;
  static icon = "calculator";

  static section = "Tools";

  static parse(params: SetOptional<MathNodeData, "type">): MathNodeData {
    return {
      ...params,
      type: "MathNode",
    };
  }

  constructor(di: DiContainer, data: MathNodeData) {
    super("MathNode", di, data, MathNodeMachine, {});
    this.description = data.description || MathNode.description;
    this.setup();
  }
}
