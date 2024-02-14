import _ from "lodash";
import dedent from "ts-dedent";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  None,
} from "../base";
import { match, P } from "ts-pattern";
import {
  AnyActorRef,
  assign,
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
} from "xstate";
import { DiContainer } from "../../types";
import { merge, omit } from "lodash-es";
import {
  JSONSocket,
  SocketGeneratorControl,
  generateSocket,
} from "../../controls/socket-generator";
import { WorkerMessenger } from "../../worker/messenger";
import { start } from "../../worker/main";
import { createId } from "@paralleldrive/cuid2";
import { createJsonSchema } from "../../utils";
import { slugify } from "../../lib/string";
import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";

const inputSockets = {
  code: generateSocket({
    "x-key": "code",
    name: "Code" as const,
    title: "Code",
    type: "string" as const,
    default: "async function (context) {\n  return 42\n}",
    description: "the code",
    "x-showSocket": false,
    required: true,
    "x-libraries": [],
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
          "moment",
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
        [key: string]: any;
      };
      parent: {
        id: string;
      };
    },
    context: {} as {
      inputs: {
        code: string;
        [key: string]: any;
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
          args: context.inputs,
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
          name: "Javascript",
          description: "Javascript code interpreter",
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
          enqueue.assign({
            inputSockets: ({ context, event }) => {
              return {
                ...context.inputSockets,
                code: {
                  ...context.inputSockets["code"],
                  "x-libraries": context.inputs.libraries,
                },
              };
            },
          });
        }),
      },
      UPDATE_SOCKET: {
        actions: ["updateSocket"],
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
            actions: enqueueActions(({ enqueue, context, system }) => {
              const runId = `call-${createId()}`;
              enqueue.sendTo(system.get("editor"), ({ self }) => ({
                type: "SPAWN",
                params: {
                  parent: self.id,
                  id: runId,
                  machineId: "NodeJavascriptCodeInterpreter.run",
                  systemId: runId,
                  input: {
                    inputs: {
                      code: context.inputs.code,
                      libraries: context.inputs.libraries,
                      args: {
                        inputs: _.omit(context.inputs, [
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
            }),
          },
          RESET: {
            guard: ({ context }) => {
              return context.runs && Object.keys(context.runs).length > 0;
            },
            actions: enqueueActions(({ enqueue, context, system }) => {
              Object.entries(context.runs).forEach(([runId, run]) => {
                enqueue.sendTo(system.get("editor"), {
                  type: "DESTROY",
                  params: {
                    id: runId,
                  },
                });
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
    actions: {
      updateConfig: assign({
        inputSockets: ({ event, context }) =>
          match(event)
            .with({ type: "CONFIG_CHANGE" }, ({ inputSockets }) => ({
              inputs: inputSockets,
              libraries: context.inputSockets.libraries,
              code: context.inputSockets.code,
              run: context.inputSockets.run,
            }))
            .run(),
        name: ({ event }) =>
          match(event)
            .with({ type: "CONFIG_CHANGE" }, ({ name }) => name)
            .run(),
        description: ({ event }) =>
          match(event)
            .with({ type: "CONFIG_CHANGE" }, ({ description }) => description)
            .run(),
        schema: ({ event }: any) =>
          match(event)
            .with({ type: "CONFIG_CHANGE" }, ({ schema }) => schema)
            .run(),
        outputs: ({ context, event }) =>
          match(event)
            .with(
              {
                type: "CONFIG_CHANGE",
                name: P.string,
                description: P.string,
              },
              ({ schema }) => ({
                object: context.inputs,
                schema: {
                  name: slugify(event.name, "_"),
                  description: event.description,
                  parameters: schema,
                },
              }),
            )
            .run(),
      }),
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
    const state = this.actor.getSnapshot();
    const inputGenerator = new SocketGeneratorControl(
      this.actor,
      (s) => omit(s.context.inputSockets, ["code", "run", "libraries"]),
      {
        connectionType: "input",
        name: "Input Sockets",
        ignored: ["trigger"],
        tooltip: "Add input sockets",
        initial: {
          name: state.context.name,
          description: state.context.description,
        },
        onChange: ({ sockets, name, description }) => {
          const schema = createJsonSchema(sockets);
          this.setLabel(name);
          this.actor.send({
            type: "CONFIG_CHANGE",
            name,
            description: description || "",
            inputSockets: sockets,
            schema,
          });
        },
      },
    );
    this.setLabel(
      this.snap.context.name || NodeJavascriptCodeInterpreter.label,
    );
    this.addControl("inputGenerator", inputGenerator);
  }
}
