import { createId } from "@paralleldrive/cuid2";
import { isNil, isNull, merge, set, omit } from "lodash-es";
import {
  BaseUrlApiConfiguration,
  generateText,
  ollama,
  openai,
  ToolCallError,
} from "modelfusion";
import dedent from "ts-dedent";
import { P, match } from "ts-pattern";
import type { SetOptional } from "type-fest";
import type { ActorRefFrom, AnyActorRef, OutputFrom } from "xstate";
import { createMachine, enqueueActions, fromPromise, setup } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { DiContainer } from "../../types";
import { BaseNode, NodeContextFactory } from "../base";
import type {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  None,
  ParsedNode,
} from "../base";
import type { OllamaModelConfig, OllamaModelMachine } from "../ollama/ollama";
import type { OpenAIModelConfig, OpenaiModelMachine } from "../openai/openai";
import { inputSocketMachine } from "../../input-socket";

const inputSockets = {
  RUN: generateSocket({
    name: "Run" as const,
    type: "trigger" as const,
    description: "Run",
    required: false,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "RUN",
    "x-event": "RUN",
    // "x-event-param-socket-keys": ["llm", "system", "instruction"],

    "x-event-param-socket-keys": ["instruction"],
  }),
  instruction: generateSocket({
    name: "instruction" as const,
    type: "string" as const,
    description: "Instruction for LLM to generate text",
    required: true,
    isMultiple: false,
    "x-controller": "textarea",
    "x-key": "instruction",
    "x-showSocket": true,
  }),
  system: generateSocket({
    name: "system" as const,
    type: "string" as const,
    description: "System Message",
    required: false,
    isMultiple: false,
    "x-controller": "textarea",
    title: "System Message",
    "x-showSocket": true,
    "x-key": "system",
  }),
  llm: generateSocket({
    "x-key": "llm",
    name: "Model",
    title: "Model",
    type: "object",
    description: dedent`
    The language model to use for generating text. 
    `,
    allOf: [
      {
        enum: ["NodeOllama", "NodeOpenAI"],
        type: "string" as const,
      },
    ],
    "x-controller": "select",
    "x-actor-type": "NodeOllama",
    "x-actor-config": {
      NodeOllama: {
        connections: {
          config: "llm",
        },
        internal: {
          config: "llm",
        },
      },
      NodeOpenAI: {
        connections: {
          config: "llm",
        },
        internal: {
          config: "llm",
        },
      },
    },
    "x-showSocket": true,
    isMultiple: false,
  }),
};

const outputSockets = {
  onDone: generateSocket({
    name: "On Done" as const,
    type: "trigger" as const,
    description: "Done",
    required: false,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "onDone",
    "x-event": "onDone",
  }),
  result: generateSocket({
    name: "result" as const,
    type: "string" as const,
    description: "Result of the generation",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "result",
  }),
  text: generateSocket({
    name: "text" as const,
    type: "string" as const,
    description: "Generated text",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "text",
  }),
};

interface GenerateTextInput {
  llm: OpenAIModelConfig | OllamaModelConfig;
  system?: string;
  instruction: string;
}

const computeExecutionValue = (actorRef: AnyActorRef) => {
  const state = actorRef.getSnapshot();
  const value: Record<string, any> = {};

  for (const [key, outputValue] of Object.entries(
    state.context.outputs.config,
  )) {
    console.log("OUTPUT VALUE", key, outputValue);
    match(outputValue)
      .with(
        {
          src: P.string.startsWith("Node"),
        },
        (_, actorRef: AnyActorRef) => {
          value[key] = computeExecutionValue(actorRef);
        },
      )
      .with(
        {
          src: P.string.startsWith("value"),
        },
        (val) => {
          value[key] = val.getSnapshot().context.value;
        },
      )
      .otherwise((val) => {
        value[key] = val;
      });
  }

  return value;
};

const generateTextActor = fromPromise(
  async ({ input }: { input: GenerateTextInput }) => {
    console.log("INPUT", input);

    const result = match(input)
      .with(
        {
          llm: {
            provider: "ollama",
          },
        },
        async ({ llm }) => {
          const model = ollama
            .CompletionTextGenerator({
              ...llm,
              api: new BaseUrlApiConfiguration(llm.apiConfiguration),
            })
            .withInstructionPrompt();
          const res = await generateText({
            model,
            prompt: {
              system: input.system,
              instruction: input.instruction,
            },
            fullResponse: true,
          });
          return res;
        },
      )
      .with(
        {
          llm: {
            provider: "openai",
          },
        },
        ({ llm }) => {
          const model = openai
            .ChatTextGenerator({
              ...llm,
              api: new BaseUrlApiConfiguration(llm.apiConfiguration),
            })
            .withInstructionPrompt();
          const res = generateText({
            model,
            prompt: {
              system: input.system,
              instruction: input.instruction,
            },
            fullResponse: true,
          });
          return res;
        },
      )
      .run();
    return result;
  },
);

interface GenerateTextCallInput {
  llm: ActorRefFrom<typeof OllamaModelMachine | typeof OpenaiModelMachine>;
  system?: string;
  instruction: string;
}

const generateTextCall = setup({
  types: {
    input: {} as {
      inputs: GenerateTextCallInput;
      senders: {
        id: string;
      }[];
      parent: {
        id: string;
      };
    },
    context: {} as {
      inputs: GenerateTextInput;
      outputs: null | {
        ok: boolean;
        result: OutputFrom<typeof generateTextActor> | ToolCallError;
      };
      senders: {
        id: string;
      }[];
      parent: {
        id: string;
      };
    },
    output: {} as {
      result: OutputFrom<typeof generateTextActor>;
      ok: boolean;
    },
  },
  actors: {
    run: generateTextActor,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOgIH0AHAJwHspq5YBiCWws-AN1oGswSaLHkKkKNeo1iwEBHpnQAXXOwDaABgC6GzYlCVasXMvZ6QAD0QAmdQA4SANgAs6hwGY3ARk-qnbu24ANCAAnoi2niRuVlYAnJ4OAKxODlZuyQC+GcFCOATEnFR0DEzMYNR01CSUADZKAGa01KiCGHmihRIl0rLctAom+Do6ZgZGg2aWCDb2zq4e3r7+tkGh1mkkTlaetrZ2tk6eVu5ZOW0iBeWVzABKAKIAKjcAmiNIIGPGKviT6w4kiQA7Opop5AZ5EnZErErMEwggwW4AbF3IlbLF4vF0okstkQPhaBA4GZchciKNDF9TO8pgBaBxwxD004gUn5MT4IqSJgU8bfX4ILaMhHqSK2QGxXZOJy2JKJVIOFlsjqYWioWpgRRgXlUn40xAeQEA6GxdSJY7qS17QHCnyRFIRUVeSUQjxK87skhXJo6ib6hCG40Ys0Wq3qG1rBEREgHaFWRJHByxQG2XEZIA */
  initial: "prepare",
  context: ({ input }) => {
    return {
      ...input,
      inputs: {
        ...input.inputs,
      },
      outputs: null,
    };
  },
  states: {
    prepare: {
      always: [
        {
          guard: ({ context }) => {
            return Object.values(context.inputs).every((t) => !isNull(t));
          },
          target: "in_progress",
        },
      ],
    },
    in_progress: {
      invoke: {
        src: "run",
        input: ({ context }) => {
          return context.inputs;
        },
        onDone: {
          target: "complete",
          actions: enqueueActions(({ enqueue, context }) => {
            enqueue.assign({
              outputs: ({ event }) => ({
                result: event.output,
                ok: true,
              }),
            });
            for (const sender of context.senders) {
              enqueue.sendTo(
                ({ system }) => system.get(sender.id),
                ({ context, self }) => ({
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
          target: "error",
          actions: enqueueActions(({ enqueue, context, self, event }) => {
            console.log("ERROR", event);
            enqueue.assign({
              outputs: ({ event }) => ({
                result: new ToolCallError({
                  toolCall: {
                    id: self.id,
                    name: "GenerateText",
                    args: context.inputs,
                  },
                  cause: event.error,
                  message: (event.error as Error).message,
                }),
                ok: false,
              }),
            });
            for (const sender of context.senders) {
              enqueue.sendTo(
                ({ system }) => system.get(sender.id),
                ({ context, self }) => ({
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
      },
    },
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
    },
    error: {
      on: {
        RETRY: {
          target: "in_progress",
        },
      },
    },
  },
});

const GenerateTextMachine = createMachine({
  id: "node-generate-text",
  entry: enqueueActions(({ enqueue }) => {
    enqueue("initialize");
  }),
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "Generate Text",
      description: "Use LLMs to generate text base on a prompt",
      inputSockets,
      outputSockets,
    }),
  types: {} as BaseMachineTypes<{
    input: BaseInputType<typeof inputSockets, typeof outputSockets>;
    context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
      runs: Record<string, AnyActorRef>;
      computes: Record<string, AnyActorRef>;
    };
    actions: None;
    events: {
      type: "INITIALIZE";
    };
    guards: None;
    actors: {
      src: "generateText";
      logic: typeof generateTextCall;
    };
  }>,
  initial: "idle",
  on: {
    ASSIGN_CHILD: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("assignChild");
      }),
    },
    INITIALIZE: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("initialize");
      }),
    },
    SET_VALUE: {
      actions: enqueueActions(({ enqueue, context }) => {
        enqueue("setValue");
      }),
    },
  },
  states: {
    idle: {
      on: {
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
        RESULT: {
          actions: enqueueActions(({ enqueue, check, self, event }) => {
            enqueue.assign({
              outputs: ({ context, event }) => ({
                ...context.outputs,
                ...event.params?.res.result,
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

        RUN: {
          // guard: and([
          //   ({ context }) => context.inputs.instruction !== "",
          //   ({ context }) => context.inputs.llm !== null,
          // ]),
          actions: enqueueActions(
            ({ enqueue, check, context, self, event }) => {
              // if (check(({ event }) => !isNil(event.params?.values))) {
              //   enqueue(({ event }) => ({
              //     type: "setValue",
              //     params: {
              //       values: event.params?.values!,
              //     },
              //   }));
              // }
              console.log("RUNNING BEFORE", event);
              if (event?.origin?.type !== "compute-event") {
                const triggerSocket = context.inputSockets[
                  `${self.id}:input:RUN`
                ] as unknown as ActorRefFrom<typeof inputSocketMachine>;

                const eventDefinition =
                  triggerSocket.getSnapshot().context.definition;

                const payload = {
                  ...eventDefinition["x-event-param-socket-keys"].reduce(
                    (acc, key) => {
                      acc[key] = null;
                      return acc;
                    },
                    {},
                  ),
                  ...(event?.params?.values ? event.params.values : {}),
                  ...(event?.params?.inputs ? event.params.inputs : {}),
                };

                if (Object.values(payload).some((v) => isNull(v))) {
                  console.log("COMPUTING EVENT", payload);
                  const childId = `compute-${createId()}`;
                  // enqueue.spawnChild("computeEvent", {
                  //   input: {
                  //     inputSockets: context.inputSockets,
                  //     inputs: payload,
                  //     event: "RUN",
                  //     parent: self,
                  //   },
                  //   systemId: childId,
                  //   id: childId,
                  // });

                  enqueue.assign({
                    computes: ({ spawn, context }) => {
                      return {
                        ...context.computes,
                        [childId]: spawn("computeEvent", {
                          input: {
                            inputSockets: context.inputSockets,
                            inputs: payload,
                            event: "RUN",
                            parent: self,
                          },
                          systemId: childId,
                          id: childId,
                        }),
                      };
                    },
                  });
                  // Return to wait for the compute event to finish
                  console.log("TRIGGER A COMPUTE EVENT");
                  return;
                }
              }
              enqueue.assign({
                computes: ({ context }) => {
                  return omit(context.computes, event.origin.id);
                },
              });

              console.log("RUNNING", event);

              const runId = `call-${createId()}`;

              // const sockets = Object.values(context.inputSockets);
              // for (const socket of sockets) {
              //   enqueue.sendTo(socket, {
              //     type: "COMPUTE",
              //   });
              // }

              enqueue.sendTo<ActorRefFrom<typeof generateTextCall>>(
                ({ system }) => system.get("editor"),
                ({ self, context }) => ({
                  type: "SPAWN",
                  params: {
                    id: runId,
                    parentId: self.id,
                    machineId: "NodeGenerateText.run",
                    systemId: runId,
                    input: {
                      inputs: {
                        ...event.params.inputs,
                      },
                      senders: [{ id: self.id }],
                      parent: {
                        id: self.id,
                      },
                    },
                    syncSnapshot: true,
                  },
                }),
              );
            },
          ),
        },
      },
    },
    complete: {},
    error: {},
  },
});

export type GenerateTextNode = ParsedNode<
  "NodeGenerateText",
  typeof GenerateTextMachine
>;

export class NodeGenerateText extends BaseNode<typeof GenerateTextMachine> {
  static nodeType = "GenerateText";
  static label = "Generate Text";
  static description = "Use LLMs to generate text base on a prompt";
  static icon = "openAI";

  static section = "Functions";

  static parse(
    params: SetOptional<GenerateTextNode, "type">,
  ): GenerateTextNode {
    return {
      ...params,
      type: "NodeGenerateText",
    };
  }

  static machines = {
    NodeGenerateText: GenerateTextMachine,
    ["NodeGenerateText.run"]: generateTextCall,
  };

  constructor(di: DiContainer, data: GenerateTextNode) {
    super("NodeGenerateText", di, data, GenerateTextMachine, {});
  }
}
