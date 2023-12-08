import dedent from "dedent";
import { merge } from "lodash-es";
import {
  generateStructure,
  openai,
  OPENAI_CHAT_MODELS,
  OpenAIApiConfiguration,
  OpenAIChatMessage,
  OpenAIChatSettings,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
  UncheckedStructureDefinition,
} from "modelfusion";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { Input, Output } from "../../input-output";
import { MappedType, Tool, triggerSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../base";

const inputSockets = {
  system: generateSocket({
    name: "system" as const,
    type: "string" as const,
    description: "System Message",
    required: false,
    isMultiple: false,
    "x-controller": "textarea",
    "x-key": "system",
    "x-showSocket": true,
  }),
  user: generateSocket({
    name: "user" as const,
    type: "string" as const,
    description: "User Prompt",
    required: true,
    isMultiple: false,
    "x-controller": "textarea",
    "x-key": "user",
    "x-showSocket": true,
  }),
  schema: generateSocket({
    name: "schema" as const,
    type: "tool" as const,
    description: "Schema",
    required: true,
    isMultiple: false,
    "x-controller": "socket-generator",
    "x-key": "schema",
  }),
  model: generateSocket({
    "x-key": "model",
    name: "model" as const,
    title: "Model",
    type: "string" as const,
    allOf: [
      {
        enum: Object.keys(OPENAI_CHAT_MODELS),
        type: "string" as const,
      },
    ],
    "x-controller": "select",
    default: "gpt-3.5-turbo-1106",
    description: dedent`
    The model to use for generating text. You can see available models
    `,
  }),
  temperature: generateSocket({
    "x-key": "temperature",
    name: "temperature" as const,
    title: "Temperature",
    type: "number" as const,
    description: dedent`
    The sampling temperature, between 0 and 1. Higher values like
    0.8 will make the output more random, while lower values like
    0.2 will make it more focused and deterministic. If set to 0,
    the model will use log probability to automatically increase
    the temperature until certain thresholds are hit`,
    required: true,
    default: 0.7,
    minimum: 0,
    maximum: 1,
    isMultiple: false,
    "x-showSocket": false,
  }),
  maxCompletionTokens: generateSocket({
    "x-key": "maxCompletionTokens",
    name: "maxCompletionTokens" as const,
    title: "Max Completion Tokens",
    type: "number" as const,
    description: dedent`
    The maximum number of tokens to generate in the chat
    completion. The total length of input tokens and generated
    tokens is limited by the model's context length.`,
    required: true,
    default: 1000,
    minimum: 0,
    maximum: 4141,
    isMultiple: false,
    "x-showSocket": false,
  }),
};

const outputSockets = {
  result: {
    name: "result" as const,
    type: "string" as const,
    description: "Result",
    required: true,
    isMultiple: true,
  },
};

const OpenAIGenerateStructureMachine = createMachine({
  id: "openai-generate-structure",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          schema: {
            name: "",
            description: "",
            schema: {},
          },
          system: "",
          user: "",
          temperature: 0.7,
          maxCompletionTokens: 1000,
          model: "gpt-3.5-turbo-1106",
        },
        outputs: {
          result: "",
        },
        inputSockets: inputSockets,
        outputSockets: outputSockets,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      inputs: MappedType<typeof inputSockets>;
      outputs: MappedType<typeof outputSockets>;
      settings: {
        openai: OpenAIChatSettings;
      };
    };
    context: {
      inputs: MappedType<typeof inputSockets>;
      outputs: MappedType<typeof outputSockets>;
      settings: {
        openai: OpenAIChatSettings;
      };
    };
    actions: {
      type: "adjustMaxCompletionTokens";
    };
    events: {
      type: "CONFIG_CHANGE";
      openai: OpenAIChatSettings;
    };
    actors: {
      src: "generateText";
      logic: ReturnType<typeof generateStructureActor>;
    };
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        CONFIG_CHANGE: {
          actions: assign({
            settings: ({ event }) => ({
              openai: event.openai,
            }),
          }),
        },
        RUN: {
          target: "running",
          actions: ["setValue"],
        },
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        SET_VALUE: {
          actions: ["setValue", "adjustMaxCompletionTokens"],
        },
      },
    },
    running: {
      invoke: {
        src: "generateStructure",
        input: ({ context }): GenerateStructureInput => {
          return {
            openai: {
              model: context.inputs.model,
              temperature: context.inputs.temperature,
              maxCompletionTokens: context.inputs.maxCompletionTokens,
            },
            system: context.inputs.system,
            user: context.inputs.user,
            schema: context.inputs.schema,
          };
        },
        onDone: {
          target: "#openai-generate-structure.complete",
          actions: assign({
            outputs: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "#openai-generate-structure.error",
          actions: ["setError"],
        },
      },
    },
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
    },
    error: {
      on: {
        RUN: {
          target: "running",
          actions: ["setValue"],
        },
        CONFIG_CHANGE: {
          actions: assign({
            settings: ({ event }) => ({
              openai: event.openai,
            }),
          }),
        },
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
  },
  output: ({ context }) => context.outputs,
});

export type OpenAIGenerateStructureNode = ParsedNode<
  "OpenAIGenerateStructure",
  typeof OpenAIGenerateStructureMachine
>;

type GenerateStructureInput = {
  openai: OpenAIChatSettings;
  system: string;
  user: string;
  schema: Tool;
};

const generateStructureActor = ({
  api,
}: {
  api: () => OpenAIApiConfiguration;
}) =>
  fromPromise(async ({ input }: { input: GenerateStructureInput }) => {
    console.log("@@@", { input });
    const structure = await generateStructure(
      openai.ChatTextGenerator({
        api: api(),
        ...input.openai,
      }),
      new UncheckedStructureDefinition({
        name: input.schema.name,
        description: input.schema.description,
        jsonSchema: input.schema.schema,
      }),
      [
        OpenAIChatMessage.system(input.system),
        OpenAIChatMessage.user(input.user),
      ],
    );
    return {
      result: structure,
    };
  });

export class OpenAIGenerateStructure extends BaseNode<
  typeof OpenAIGenerateStructureMachine
> {
  static nodeType = "OpenAIGenerateStructure";
  static label = "Generate Structure";
  static description = "Usefull for generating structured data from a OpenAI";
  static icon = "openAI";

  static section = "OpenAI";

  static parse(
    params: SetOptional<OpenAIGenerateStructureNode, "type">,
  ): OpenAIGenerateStructureNode {
    return {
      ...params,
      type: "OpenAIGenerateStructure",
    };
  }

  get apiModel() {
    if (!this.di.variables.has("OPENAI_API_KEY")) {
      throw new Error("MISSING_API_KEY_ERROR: OPENAI_API_KEY");
    }
    const api = new OpenAIApiConfiguration({
      apiKey: this.di.variables.get("OPENAI_API_KEY") as string,
      throttle: throttleMaxConcurrency({ maxConcurrentCalls: 1 }),
      retry: retryWithExponentialBackoff({
        maxTries: 2,
        initialDelayInMs: 1000,
        backoffFactor: 2,
      }),
    });
    return api;
  }

  constructor(di: DiContainer, data: OpenAIGenerateStructureNode) {
    super("OpenAIGenerateStructure", di, data, OpenAIGenerateStructureMachine, {
      actors: {
        generateStructure: generateStructureActor({ api: () => this.apiModel }),
      },
      actions: {
        adjustMaxCompletionTokens: assign({
          inputSockets: ({ event, context }) => {
            if (event.type !== "SET_VALUE") return context.inputSockets;
            if (event.values.model) {
              return {
                ...context.inputSockets,
                maxCompletionTokens: {
                  ...context.inputSockets.maxCompletionTokens,
                  maximum:
                    OPENAI_CHAT_MODELS[
                      event.values.model as keyof typeof OPENAI_CHAT_MODELS
                    ].contextWindowSize,
                },
              };
            }
            return context.inputSockets;
          },
        }),
      },
    });
    this.addInput("trigger", new Input(triggerSocket, "Exec", true));
    this.addOutput("trigger", new Output(triggerSocket, "Exec"));
  }
}
