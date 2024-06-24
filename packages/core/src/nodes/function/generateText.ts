import { createId } from "@paralleldrive/cuid2";
import { isNull } from "lodash-es";
import {
  BaseUrlApiConfiguration,
  generateText,
  ollama,
  openai,
  ToolCallError,
} from "modelfusion";
import dedent from "ts-dedent";
import { match } from "ts-pattern";
import type { SetOptional } from "type-fest";
import {
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
  type ActorRefFrom,
  type AnyActorRef,
  type OutputFrom,
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
import type { OllamaModelConfig, OllamaModelMachine } from "../ollama/ollama";
import type { OpenAIModelConfig, OpenaiModelMachine } from "../openai/openai";

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
        async ({ llm }) => {
          const model = openai
            .ChatTextGenerator({
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
      outputs:
        | null
        | (OutputFrom<typeof generateTextActor> & {
            ok: true;
          })
        | (ToolCallError & {
            ok: false;
          });
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
                ...event.output,
                result: event.output.text,
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
                ...new ToolCallError({
                  toolCall: {
                    id: self.id,
                    name: "GenerateText",
                    args: context.inputs,
                  },
                  cause: event.error,
                  message: (event.error as Error).message,
                }).toJSON(),
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
                ...event.params?.res,
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
          actions: enqueueActions(
            ({ enqueue, check, context, self, event }) => {
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
              enqueue.sendTo<ActorRefFrom<typeof generateTextCall>>(
                ({ system }) => system.get("editor"),
                ({ self }) => ({
                  type: "SPAWN_RUN",
                  params: {
                    id: runId,
                    parentId: self.id,
                    machineId: "NodeGenerateText.run",
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
