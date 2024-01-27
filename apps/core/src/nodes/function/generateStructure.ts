import { createId } from "@paralleldrive/cuid2";
import { isNil, merge } from "lodash-es";
import {
  BaseUrlApiConfiguration,
  generateStructure,
  jsonStructurePrompt,
  ollama,
  openai,
  ToolCallError,
  UncheckedSchema,
} from "modelfusion";
import dedent from "ts-dedent";
import { match } from "ts-pattern";
import type { SetOptional } from "type-fest";
import type { AnyActorRef, OutputFrom } from "xstate";
import { and, createMachine, enqueueActions, fromPromise, setup } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { Tool } from "../../sockets";
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
  system: generateSocket({
    name: "system" as const,
    type: "string" as const,
    description: "System Message",
    required: false,
    isMultiple: false,
    default: "",
    "x-controller": "textarea",
    "x-key": "system",
    "x-showSocket": true,
  }),
  instruction: generateSocket({
    name: "instruction" as const,
    type: "string" as const,
    description: "Instructions for the model to generateStructure for.",
    required: true,
    isMultiple: false,
    default: "",
    "x-controller": "textarea",
    "x-key": "user",
    "x-showSocket": true,
  }),
  schema: generateSocket({
    name: "schema" as const,
    type: "object" as const,
    description: "Schema",
    required: true,
    isMultiple: false,
    "x-controller": "socket-generator",
    "x-key": "schema",
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
    "x-actor-type": "OpenAI",
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
  method: generateSocket({
    "x-key": "method",
    name: "Method",
    title: "Method",
    type: "string",
    description: dedent`
    The method to use for generating text. 
    Function calling is only available for OpenAI models.
    JSON
    `,
    allOf: [
      {
        enum: ["json", "functionCall"],
        type: "string" as const,
      },
    ],
    "x-controller": "select",
    "x-showSocket": false,
    default: "json",
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
    description: "Result",
    required: true,
    isMultiple: true,
    "x-key": "result",
  }),
};

const OpenAIGenerateStructureMachine = createMachine({
  id: "openai-generate-structure",
  context: ({ input }) => {
    const defaultInputs: (typeof input)["inputs"] = {};
    for (const [key, socket] of Object.entries(inputSockets)) {
      if (socket.default) {
        defaultInputs[key as any] = socket.default;
      } else {
        defaultInputs[key as any] = undefined;
      }
    }
    return merge<typeof input, any>(
      {
        inputs: {
          ...defaultInputs,
        },
        outputs: {
          result: "",
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
    events: None;
    actors: {
      src: "generateText";
      logic: typeof generateStructureActor;
    };
    guards: None;
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
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
          guard: and([
            ({ context }) => !isNil(context.inputs.schema),
            ({ context }) => !isNil(context.inputs.llm),
          ]),
          actions: enqueueActions(({ enqueue }) => {
            const runId = `call-${createId()}`;
            enqueue.assign({
              runs: ({ context, spawn, self }) => {
                const run = spawn("generateStructure", {
                  id: runId,
                  input: {
                    inputs: {
                      llm: context.inputs.llm! as
                        | OpenAIModelConfig
                        | OllamaModelConfig,
                      method: context.inputs.method!,
                      system: context.inputs.system,
                      instruction: context.inputs.instruction,
                      schema: context.inputs.schema,
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
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        UPDATE_CHILD_ACTORS: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("spawnInputActors");
            enqueue("setupInternalActorConnections");
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

interface GenerateStructureInput {
  llm: OpenAIModelConfig | OllamaModelConfig;
  method: "json" | "functionCall";
  system?: string;
  instruction?: string;
  schema: Tool;
}

const generateStructureActor = fromPromise(
  async ({ input }: { input: GenerateStructureInput }) => {
    console.log("@@@", { input });

    const model = match([input.llm, input.method])
      .with(
        [
          {
            provider: "ollama",
          },
          "json",
        ],
        ([config]) => {
          const model = ollama
            .ChatTextGenerator({
              ...config,
              api: new BaseUrlApiConfiguration(config.apiConfiguration),
              format: "json",
            })
            .asStructureGenerationModel(jsonStructurePrompt.instruction());
          return () =>
            generateStructure(
              model,
              new UncheckedSchema(input.schema.parameters),
              {
                system: input.system,
                instruction: input?.instruction || "",
              },
              {
                fullResponse: true,
              },
            );
        },
      )
      .with(
        [
          {
            provider: "openai",
          },
          "json",
        ],
        ([config]) => {
          const model = openai
            .ChatTextGenerator({
              ...config,
              api: new BaseUrlApiConfiguration(config.apiConfiguration),
              responseFormat: { type: "json_object" }, // force JSON output
            })
            .asStructureGenerationModel(jsonStructurePrompt.instruction());
          return () =>
            generateStructure(
              model,
              new UncheckedSchema(input.schema.parameters),
              {
                system: input.system,
                instruction: input?.instruction || "",
              },
              {
                fullResponse: true,
              },
            );
        },
      )
      .with(
        [
          {
            provider: "openai",
          },
          "functionCall",
        ],
        ([config]) => {
          const model = openai
            .ChatTextGenerator({
              ...config,
              api: new BaseUrlApiConfiguration(config.apiConfiguration),
            })
            .asFunctionCallStructureGenerationModel({
              fnName: input.schema.name,
              fnDescription: input.schema.description,
            })
            .withInstructionPrompt();
          return () =>
            generateStructure(
              model,
              new UncheckedSchema(input.schema.parameters),
              {
                system: input.system,
                instruction: input?.instruction || "",
              },
              {
                fullResponse: true,
              },
            );
        },
      )
      .run();
    const structure = await model();

    return structure;
  },
);

const generateStructureCall = setup({
  types: {
    input: {} as {
      inputs: GenerateStructureInput;
      senders: AnyActorRef[];
    },
    context: {} as {
      inputs: GenerateStructureInput;
      outputs: null | {
        ok: boolean;
        result: OutputFrom<typeof generateStructureActor> | ToolCallError;
      };
      senders: AnyActorRef[];
    },
    output: {} as {
      result: OutputFrom<typeof generateStructureActor>;
      ok: boolean;
    },
  },
  actors: {
    run: generateStructureActor,
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
      type: "final",
      on: {
        RETRY: {
          target: "in_progress",
        },
      },
      output: ({ context }) => context.outputs,
    },
  },
});

export type OpenAIGenerateStructureNode = ParsedNode<
  "GenerateStructure",
  typeof OpenAIGenerateStructureMachine
>;

export class GenerateStructure extends BaseNode<
  typeof OpenAIGenerateStructureMachine
> {
  static nodeType = "OpenAIGenerateStructure";
  static label = "Generate Structure";
  static description = "Use LLMs to create a structed data";
  static icon = "FileJson";

  static section = "Functions";

  static parse(
    params: SetOptional<OpenAIGenerateStructureNode, "type">,
  ): OpenAIGenerateStructureNode {
    return {
      ...params,
      type: "GenerateStructure",
    };
  }

  constructor(di: DiContainer, data: OpenAIGenerateStructureNode) {
    super("GenerateStructure", di, data, OpenAIGenerateStructureMachine, {
      actors: {
        generateStructure: generateStructureCall,
      },
    });
    this.extendMachine({
      actors: {
        Ollama: OllamaModelMachine.provide({
          ...(this.baseImplentations as any),
        }),
        OpenAI: OpenaiModelMachine.provide({
          ...(this.baseImplentations as any),
        }),
      },
    });

    this.setup();
  }
}
