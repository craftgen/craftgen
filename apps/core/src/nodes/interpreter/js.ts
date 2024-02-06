import dedent from "ts-dedent";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  None,
} from "../base";
import {
  AnyActorRef,
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
} from "xstate";
import { DiContainer } from "../../types";
import { merge } from "lodash-es";
import { generateSocket } from "../../controls/socket-generator";
import { WorkerMessenger } from "../../worker/messenger";
import { start } from "../../worker/main";
import { createId } from "@paralleldrive/cuid2";

const inputSockets = {
  code: generateSocket({
    "x-key": "code",
    name: "Code" as const,
    title: "Code",
    type: "string" as const,
    default: "async () => {\n  return 42\n}",
    description: "the code",
    required: true,
  }),
  run: generateSocket({
    "x-key": "run",
    name: "run" as const,
    title: "Run",
    type: "trigger" as const,
    default: false,
    "x-event": "RUN",
    description: "Run the Javascript code",
    required: true,
  }),
};
const outputSockets = {
  result: generateSocket({
    "x-key": "result",
    name: "result" as const,
    title: "Result",
    type: "object" as const,
    description: "The result of the Javascript code",
    required: true,
  }),
};

type JavascriptCodeInterpreterInput = {
  // worker: WorkerMessenger;
  code: string;
};

const executeJavascriptCode = fromPromise(
  async ({ input }: { input: JavascriptCodeInterpreterInput }) => {
    const worker = start();
    const result = await worker.postoffice.sendScript(input.code, []);
    return result;
  },
);

export const executeJavascriptCodeMachine = setup({
  types: {
    input: {} as {
      code: string;
    },
    context: {} as {
      inputs: {
        code: string;
      };
      outputs: {
        result: any | null;
      };
    },
  },
  actors: {
    executeJavascriptCode,
  },
}).createMachine({
  id: "executeJavascriptCode",
  context: ({ input }) => ({
    inputs: {
      code: input.code,
    },
    outputs: {
      result: null,
    },
  }),
  initial: "run",
  states: {
    run: {
      invoke: {
        src: "executeJavascriptCode",
        input: ({ context }) => ({
          code: context.inputs.code,
        }),
        onDone: {
          target: "done",
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({
              outputs: ({ context, event }) => {
                return {
                  ...context.outputs,
                  result: event.output,
                  ok: true,
                };
              },
            });
          }),
        },
        onError: {
          target: "error",
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({
              outputs: ({ context, event }) => {
                return {
                  ...context.outputs,
                  result: event.error,
                  ok: false,
                };
              },
            });
          }),
        },
      },
    },
    done: {},
    error: {},
  },
});

export const JavascriptCodeInterpreterMachine = createMachine(
  {
    id: "javascript-code-interpreter",
    context: ({ input }) => {
      const defaultInputs: (typeof input)["inputs"] = {};
      for (const [key, socket] of Object.entries(inputSockets)) {
        const inputKey = key as keyof typeof inputSockets;
        if (socket.default) {
          defaultInputs[inputKey] = socket.default as any;
        } else {
          defaultInputs[inputKey] = undefined;
        }
      }
      return merge<typeof input, any>(
        {
          inputs: {
            ...defaultInputs,
          },
          outputs: {
            result: {},
          },
          inputSockets: {
            ...inputSockets,
          },
          outputSockets: {
            ...outputSockets,
          },
        },
        input,
      );
    },
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets> & {};
      context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
        worker?: WorkerMessenger;
        runs: Record<string, AnyActorRef>;
      };
      actions: None;
      events: None;
      actors: None;
      guards: None;
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
          RUN: {
            actions: enqueueActions(({ enqueue, context }) => {
              enqueue.assign({
                runs: ({ context, spawn }) => {
                  const runId = `call-${createId()}`;
                  return {
                    ...context.runs,
                    [runId]: spawn("executeJavascriptCode", {
                      id: runId,
                      input: {
                        code: context.inputs.code,
                      },
                    }),
                  };
                },
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
        },
      },
    },
  },
  {
    actors: {
      executeJavascriptCode: executeJavascriptCodeMachine,
    },
  },
);

export class NodeJavascriptCodeInterpreter extends BaseNode<
  typeof JavascriptCodeInterpreterMachine
> {
  static title = "Javascript";
  static label = "Javascript";
  static description = dedent`
    A node that can execute Javascript code.
  `;
  static icon = "code";

  static machines = {
    NodeJavascriptCodeInterpreter: JavascriptCodeInterpreterMachine,
    "NodeJavascriptCodeInterpreter.run": executeJavascriptCodeMachine,
  };

  constructor(di: DiContainer, data: any) {
    super(
      "NodeJavascriptCodeInterpreter",
      di,
      data,
      JavascriptCodeInterpreterMachine,
      {},
    );
    this.setup();
  }
}
