import { createId } from "@paralleldrive/cuid2";
import { merge } from "lodash-es";
import dedent from "ts-dedent";
import type { SetOptional } from "type-fest";
import {
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
  type ActorRefFrom,
  type AnyActorRef,
} from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { DiContainer } from "../../types";
import {
  BaseNode,
  NodeContextFactory,
  type BaseContextType,
  type BaseInputType,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
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
    type: "NodeMath",
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
        const { evaluate } = await import("mathjs/number");
        const { expression } = input;
        return evaluate(expression);
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
          actions: enqueueActions(({ enqueue, self, context }) => {
            enqueue.assign({
              outputs: ({ event }) => ({
                result: event.output,
                ok: true,
              }),
            });
            for (const sender of context.senders!) {
              enqueue.sendTo(
                ({ system }) => system.get(sender.id),
                ({ context }) => ({
                  type: "RESULT",
                  params: {
                    id: self.id,
                    res: context.outputs,
                  },
                }),
              );
            }
          }),
        },
        onError: {
          target: "complete",
          actions: enqueueActions(({ enqueue, context, event, self }) => {
            for (const sender of context.senders!) {
              enqueue.sendTo(({ system }) => system.get(sender.id), {
                type: "RESULT",
                params: {
                  id: self.id,
                  res: {
                    result: event.error,
                    ok: false,
                  },
                },
              });
            }
          }),
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

export const NodeMathMachine = createMachine({
  id: "NodeMath",
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "Math",
      description: dedent`
        A tool for evaluating mathematical expressions. Example expressions:
        '1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.`,
      inputSockets,
      outputSockets,
    }),
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
  on: {
    SET_VALUE: {
      actions: ["setValue"],
    },
  },
  states: {
    idle: {
      on: {
        RESULT: {
          actions: enqueueActions(({ enqueue, event }) => {
            console.log("RESULT", event);
            // assertEvent(event, "TOOL_RESULT");
            enqueue.assign({
              outputs: ({ context, event }) => ({
                ...context.outputs,
                result: event.params.res.result,
              }),
            });
            enqueue({
              type: "triggerSuccessors",
              params: {
                port: "onDone",
              },
            });
            enqueue("resolveOutputSockets");
          }),
        },
        RESET: {
          guard: ({ context }) => {
            return context.runs && Object.keys(context.runs).length > 0;
          },
          actions: enqueueActions(({ enqueue, context }) => {
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
            // debugger;
            console.log("MATH RUN EVENT", event);
            if (check(({ event }) => event.origin.type !== "compute-event")) {
              enqueue({
                type: "computeEvent",
                params: {
                  event: event.type,
                },
              });
              return;
            }
            enqueue({
              type: "removeComputation",
            });

            const runId = event.params.callId || `call_${createId()}`;
            enqueue.sendTo<ActorRefFrom<typeof RunMathMachine>>(
              ({ system }) => system.get("editor"),
              ({ self, context }) => ({
                type: "SPAWN_RUN",
                params: {
                  id: runId,
                  parentId: self.id,
                  machineId: "NodeMath.run",
                  systemId: runId,
                  input: {
                    inputs: {
                      ...event.params.inputs,
                    },
                    senders: [...event.params.senders],
                    parent: {
                      id: self.id,
                    },
                  },
                  syncSnapshot: true,
                },
              }),
            );
          }),
        },
      },
    },
  },
});

export type NodeMathData = ParsedNode<"NodeMath", typeof NodeMathMachine>;

export class NodeMath extends BaseNode<typeof NodeMathMachine> {
  static nodeType = "NodeMath" as const;
  static label = "Math";
  static description = dedent`
    A tool for evaluating mathematical expressions. Example expressions:
    '1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.
  `;
  static icon = "calculator";

  static section = "Tools";

  static parse(params: SetOptional<NodeMathData, "type">): NodeMathData {
    return {
      ...params,
      type: "NodeMath",
    };
  }

  static machines = {
    NodeMath: NodeMathMachine,
    "NodeMath.run": RunMathMachine,
  };

  constructor(di: DiContainer, data: NodeMathData) {
    super("NodeMath", di, data, NodeMathMachine, {});
    this.description = data.description || NodeMath.description;
  }
}
