import { createId } from "@paralleldrive/cuid2";
import { merge } from "lodash-es";
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
import type { AnyActorRef, OutputFrom } from "xstate";
import { and, createMachine, enqueueActions, fromPromise, setup } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { DiContainer } from "../../types";
import { BaseNode } from "../base";
import type {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  None,
  ParsedNode,
} from "../base";
import { OllamaModelMachine } from "../ollama/ollama";
import type { OllamaModelConfig } from "../ollama/ollama";
import { OpenaiModelMachine } from "../openai/openai";
import type { OpenAIModelConfig } from "../openai/openai";

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
        enum: ["Ollama", "OpenAI"],
        type: "string" as const,
      },
    ],
    "x-controller": "select",
    "x-actor-type": "Ollama",
    "x-actor-config": {
      Ollama: {
        connections: {
          config: "llm",
        },
        internal: {
          config: "llm",
        },
      },
      OpenAI: {
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
};

const GenerateTextMachine = createMachine({
  id: "openai-generate-text",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          RUN: undefined,
          system: "",
          instruction: "",
          llm: null,
        },
        outputs: {
          onDone: undefined,
          result: "",
        },
        inputSockets,
        outputSockets,
      },
      input,
    ),
  entry: enqueueActions(({ enqueue }) => {
    enqueue("spawnInputActors");
    enqueue("setupInternalActorConnections");
  }),
  types: {} as BaseMachineTypes<{
    input: BaseInputType<typeof inputSockets, typeof outputSockets>;
    context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
      runs: Record<string, AnyActorRef>;
    };
    actions: None;
    events: {
      type: "UPDATE_CHILD_ACTORS";
    };
    guards: None;
    actors: {
      src: "generateText";
      logic: typeof generateTextCall;
    };
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        UPDATE_CHILD_ACTORS: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("spawnInputActors");
            enqueue("setupInternalActorConnections");
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

        RESULT: {
          actions: enqueueActions(({ enqueue, check, self, event }) => {
            enqueue.assign({
              outputs: ({ context, event }) => ({
                ...context.outputs,
                result: event.params?.res,
              }),
            });
            enqueue({
              type: "triggerSuccessors",
              params: {
                port: "onDone",
              },
            });
          }),
        },

        RUN: {
          // target: "running",
          guard: and([
            ({ context }) => context.inputs.instruction !== "",
            ({ context }) => context.inputs.llm !== null,
          ]),
          actions: enqueueActions(({ enqueue }) => {
            const runId = `call-${createId()}`;
            enqueue.assign({
              runs: ({ context, spawn, self }) => {
                const run = spawn("generateText", {
                  id: runId,
                  input: {
                    inputs: {
                      llm: context.inputs.llm! as
                        | OpenAIModelConfig
                        | OllamaModelConfig,
                      system: context.inputs.system!,
                      instruction: context.inputs.instruction!,
                    },
                    senders: [self],
                  },
                  syncSnapshot: true,
                });
                return {
                  ...context.runs,
                  [runId]: run,
                };
              },
            });
          }),
        },
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
    complete: {},
    error: {
      on: {
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
  },
});

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
            })
            .withInstructionPrompt();
          const res = await generateText(
            model,
            {
              system: input.system,
              instruction: input.instruction,
            },
            {
              fullResponse: true,
            },
          );
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
          const res = generateText(
            model,
            {
              system: input.system,
              instruction: input.instruction,
            },
            {
              fullResponse: true,
            },
          );
          return res;
        },
      )
      .run();
    return result;
  },
);

const generateTextCall = setup({
  types: {
    input: {} as {
      inputs: GenerateTextInput;
      senders: AnyActorRef[];
    },
    context: {} as {
      inputs: GenerateTextInput;
      outputs: null | {
        ok: boolean;
        result: OutputFrom<typeof generateTextActor> | ToolCallError;
      };
      senders: AnyActorRef[];
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
  initial: "in_progress",
  context: ({ input }) => {
    return merge(
      {
        inputs: {},
        outputs: null,
      },
      input,
    );
  },
  states: {
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
              enqueue.sendTo(sender, ({ context, self }) => ({
                type: "RESULT",
                params: {
                  id: self.id,
                  res: context.outputs,
                },
              }));
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
              enqueue.sendTo(sender, {
                type: "RESULT",
                params: {
                  id: self.id,
                  res: context.outputs,
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
    error: {
      on: {
        RETRY: {
          target: "in_progress",
        },
      },
      output: ({ context }) => context.outputs,
    },
  },
});

export type GenerateTextNode = ParsedNode<
  "GenerateText",
  typeof GenerateTextMachine
>;

export class GenerateText extends BaseNode<typeof GenerateTextMachine> {
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
      type: "GenerateText",
    };
  }

  static machines = {
    GenerateText: GenerateTextMachine,
    ["NodeGenerateText.run"]: generateTextCall,
  };

  constructor(di: DiContainer, data: GenerateTextNode) {
    super("GenerateText", di, data, GenerateTextMachine, {
      // actors: {
      //   generateText: generateTextCall,
      // },
    });
    // this.extendMachine({
    //   actors: {
    //     Ollama: OllamaModelMachine.provide({
    //       actions: {
    //         ...this.baseActions,
    //       },
    //     }),
    //     OpenAI: OpenaiModelMachine.provide({
    //       actions: {
    //         ...this.baseActions,
    //       },
    //     }),
    //   },
    // });
    this.setup();
  }
}
