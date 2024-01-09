import { createId } from "@paralleldrive/cuid2";
import { isNil, merge } from "lodash-es";
import * as mathjs from "mathjs";
import dedent from "ts-dedent";
import { SetOptional } from "type-fest";
import {
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
      senders: AnyActorRef[];
    };
    context: {
      inputs: {
        expression: string;
      };
      outputs: {
        result?: any;
      };
      senders?: AnyActorRef[];
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
        onDone: {
          target: "complete",
          actions: enqueueActions(
            ({ enqueue, check, self, event, context }) => {
              enqueue.assign({
                outputs: ({ event }) => ({
                  result: event.output,
                  ok: true,
                }),
              });
              for (const sender of context.senders!) {
                enqueue.sendTo(sender, ({ context }) => ({
                  type: "TOOL_RESULT",
                  params: {
                    id: self.id,
                    res: context.outputs,
                  },
                }));
              }
            },
          ),
        },
        onError: {
          target: "complete",
          actions: enqueueActions(
            ({ enqueue, check, context, event, self }) => {
              for (const sender of context.senders!) {
                enqueue.sendTo(sender, {
                  type: "TOOL_RESULT",
                  params: {
                    id: self.id,
                    res: {
                      result: event.error,
                      ok: false,
                    },
                  },
                });
              }
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
          runs: {},
        },
        input,
      );
    },
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets>;
      context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
        runs: Record<string, AnyActorRef>;
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
          RESET: {
            guard: ({ context }) => {
              return context.runs && Object.keys(context.runs).length > 0;
            },
            actions: enqueueActions(({ enqueue, context, self }) => {
              Object.values(context.runs).map((run) => {
                enqueue.stopChild(run);
              });
              enqueue.assign({
                runs: {},
                outputs: ({ context }) => ({
                  ...context.outputs,
                  result: null,
                }),
              });
            }),
          },
          RUN: {
            actions: enqueueActions(({ enqueue, check, event, context }) => {
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
                enqueue.assign({
                  runs: ({ context, spawn, self }) => ({
                    ...context.runs,
                    [event.params?.executionNodeId!]: spawn("Run", {
                      id: event.params?.executionNodeId,
                      input: {
                        inputs: {
                          expression: event.params?.values?.expression,
                        },
                        senders: [self, event.params?.sender],
                      },
                      syncSnapshot: true,
                    }),
                  }),
                });
              } else {
                const runId = `call-${createId()}`;
                enqueue.assign({
                  runs: ({ context, spawn, self }) => ({
                    ...context.runs,
                    [runId]: spawn("Run", {
                      id: runId,
                      input: {
                        inputs: {
                          expression: context?.inputs.expression,
                        },
                        senders: [self],
                      },
                      syncSnapshot: true,
                    }),
                  }),
                });
              }
            }),
          },
          SET_VALUE: {
            actions: ["setValue"],
          },
          UPDATE_SOCKET: {
            actions: ["updateSocket"],
          },
        },
      },
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
