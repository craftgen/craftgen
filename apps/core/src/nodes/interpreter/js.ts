import { createId } from "@paralleldrive/cuid2";
import { merge, omit } from "lodash-es";
import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";
import dedent from "ts-dedent";
import {
  AnyActorRef,
  assign,
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
} from "xstate";

import { generateSocket, JSONSocket } from "../../controls/socket-generator";
import { DiContainer } from "../../types";
import { start } from "../../worker/main";
import { WorkerMessenger } from "../../worker/messenger";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  NodeContextFactory,
  None,
} from "../base";

const inputSockets = {
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
  logic: generateSocket({
    "x-key": "logic",
    name: "Logic" as const,
    title: "Logic",
    type: "string" as const,
    default: "async function (context) {\n  return 42\n}",
    description: "the code",
    "x-controller": "code",
    "x-showSocket": false,
    required: true,
    "x-libraries": [],
    "x-canChangeFormat": false,
    "x-language": "javascript",
  }),
  libraries: generateSocket({
    "x-key": "libraries",
    name: "libraries" as const,
    title: "Libraries",
    type: "array",
    description: "Libraries to include in the Javascript code",
    "x-controller": "js-cdn",
    default: [
      "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.10/dayjs.min.js",
    ],
    allOf: [
      {
        enum: [
          "lodash",
          "axios",
          "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.10/dayjs.min.js",
        ],
        type: "string",
      },
    ],
    "x-showSocket": false,
    required: false,
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
  code: string;
  libraries: string[];
  args: { [key: string]: any } & {
    inputs: { [key: string]: any };
  };
};

const executeJavascriptCode = fromPromise(
  async ({ input }: { input: JavascriptCodeInterpreterInput }) => {
    const worker = start(); // TODO: Re-use a pool of workers.

    const { code, args, libraries } = input;
    for (const lib of libraries) {
      await worker.postoffice.installLibrary(lib);
    }
    const result = await worker.postoffice.sendScript(code, {
      inputs: args.inputs,
    });

    worker.destroy();
    return result;
  },
);

export const executeJavascriptCodeMachine = setup({
  types: {
    input: {} as {
      inputs: {
        code: string;
        libraries: string[];
        args: { [key: string]: any } & {
          inputs: { [key: string]: any };
        };
      };
      parent: {
        id: string;
      };
    },
    context: {} as {
      inputs: {
        code: string;
        libraries: string[];
        args: { [key: string]: any } & {
          inputs: { [key: string]: any };
        };
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
  context: ({ input }) => {
    return merge(
      {
        inputs: {},
        outputs: {
          result: null,
        },
      },
      input,
    );
  },
  initial: "run",
  entry: enqueueActions(({ enqueue }) => {
    enqueue("assignParent");
  }),
  states: {
    run: {
      invoke: {
        src: "executeJavascriptCode",
        input: ({ context }) => ({
          args: context.inputs.args,
          code: context.inputs.code,
          libraries: context.inputs.libraries,
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
    done: {
      type: "final",
    },
    error: {},
  },
  output: ({ context }) => context.outputs,
});

export const JavascriptCodeInterpreterMachine = createMachine(
  {
    id: "javascript-code-interpreter",
    context: (ctx) =>
      NodeContextFactory(ctx, {
        name: "Javascript",
        description: "Javascript code interpreter",
        inputSockets,
        outputSockets,
      }),
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets> & {};
      context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
        worker?: WorkerMessenger;
        runs: Record<string, AnyActorRef>;
      };
      actions: {
        type: "updateConfig";
        params?: {
          name: string;
          description: string;
          inputSockets: JSONSocket[];
          schema: object;
        };
      };
      events: {
        type: "CONFIG_CHANGE";
        name: string;
        description: string;
        inputSockets: JSONSocket[];
        schema: JSONSchemaDefinition;
      };
      actors: None;
      guards: None;
    }>,
    initial: "idle",
    on: {
      SET_VALUE: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("setValue");
          enqueue.sendTo(
            ({ context, system }) =>
              system.get(
                Object.keys(context.inputSockets).find((k) =>
                  k.endsWith("logic"),
                ),
              ),
            ({ context }) => ({
              type: "UPDATE_SOCKET",
              params: {
                "x-libraries": context.inputs.libraries,
              },
            }),
          );
        }),
      },
      ASSIGN_CHILD: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("assignChild");
        }),
      },
      CONFIG_CHANGE: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("updateConfig");
        }),
      },
      ASSIGN_RUN: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue.assign({
            runs: ({ context, event }) => {
              return {
                ...context.runs,
                [event.params.actor.id]: event.params.actor,
              };
            },
          });
        }),
      },
    },
    states: {
      idle: {
        on: {
          RUN: {
            actions: enqueueActions(
              ({ enqueue, context, system, check, event }) => {
                if (
                  check(({ event }) => event.origin.type !== "compute-event")
                ) {
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
                enqueue.sendTo(system.get("editor"), ({ self }) => ({
                  type: "SPAWN_RUN",
                  params: {
                    id: runId,
                    parentId: self.id,
                    machineId: "NodeJavascriptCodeInterpreter.run",
                    systemId: runId,
                    input: {
                      inputs: {
                        code: context.inputs.logic,
                        libraries: context.inputs.libraries,
                        args: {
                          inputs: omit(context.inputs, [
                            "code",
                            "libraries",
                            "run",
                          ]),
                        },
                      },
                      parent: {
                        id: self.id,
                      },
                    } as any,
                  },
                }));
              },
            ),
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
