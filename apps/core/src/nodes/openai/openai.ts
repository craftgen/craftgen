import { merge } from "lodash-es";
import { OPENAI_CHAT_MODELS } from "modelfusion";
import type {
  BaseUrlPartsApiConfigurationOptions,
  OpenAIChatSettings,
} from "modelfusion";
import dedent from "ts-dedent";
import type { SetOptional } from "type-fest";
import { assign, createMachine, enqueueActions } from "xstate";

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

const inputSockets = {
  apiConfiguration: generateSocket({
    "x-key": "apiConfiguration",
    name: "api" as const,
    title: "API",
    type: "NodeApiConfiguration",
    description: dedent`
    Api configuration
    `,
    required: true,
    default: {
      baseUrl: "https://api.openai.com/v1",
    },
    isMultiple: false,
    "x-showSocket": false,
    "x-actor-type": "NodeApiConfiguration",
    "x-actor-config": {
      NodeApiConfiguration: {
        connections: {
          config: "apiConfiguration",
        },
        internal: {
          config: "apiConfiguration",
        },
      },
    },
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
    The model to use for complation of chat. You can see available models
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
  topP: generateSocket({
    "x-key": "topP",
    name: "topP" as const,
    title: "Top P",
    type: "number" as const,
    description: dedent`
    This parameter sets a threshold for token selection based on probability.
    The model will only consider the most likely tokens that cumulatively exceed this threshold while generating a response.
    It's a way to control the randomness of the output, balancing between diverse responses and sticking to more likely words.
    This means a topP of .1 will be far less random than one at .9
    `,
    required: false,
    default: 1,
    minimum: 0,
    maximum: 1,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  seed: generateSocket({
    "x-key": "seed",
    name: "seed" as const,
    title: "Seed",
    type: "number" as const,
    description: dedent`
    Used to set the initial state for the random number generator in the model.
    Providing a specific seed value ensures consistent outputs for the same inputs across different runs - useful for testing and reproducibility.
      A \`null\` value (or not setting it) results in varied, non-repeatable outputs each time.`,
    default: null,
    required: false,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  presencePenalty: generateSocket({
    "x-key": "presencePenalty",
    name: "presencePenalty" as const,
    title: "Presence Penalty",
    type: "number" as const,
    description: dedent`
    Discourages the model from repeating the same information or context already mentioned in the conversation or prompt.
    Increasing this value encourages the model to introduce new topics or ideas, rather than reiterating what has been said.
    This is useful for maintaining a diverse and engaging conversation or for brainstorming sessions where varied ideas are needed.
    Example: presencePenalty: 1.0 // Strongly discourages repeating the same content.
    `,
    default: 0,
    minimum: -2,
    maximum: 2,
    required: false,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
};

const outputSockets = {
  config: generateSocket({
    "x-key": "config",
    name: "config" as const,
    title: "Config",
    type: "NodeOpenAI",
    description: dedent`
    Ollama config
    `,
    required: true,
    isMultiple: false,
    "x-showSocket": true,
  }),
};

export type OpenAIModelConfig = OpenAIChatSettings & {
  provider: "openai";
  apiConfiguration: BaseUrlPartsApiConfigurationOptions;
};

export const OpenaiModelMachine = createMachine(
  {
    id: "openai-model",
    entry: enqueueActions(({ enqueue, context }) => {
      enqueue("initialize");
    }),
    context: (ctx) =>
      NodeContextFactory(ctx, {
        name: "OpenAI Model",
        description: "OpenAI Model",
        inputSockets,
        outputSockets,
      }),
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
    },
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets>;
      context: BaseContextType<typeof inputSockets, typeof outputSockets>;
      actions:
        | {
            type: "updateOutput";
          }
        | {
            type: "adjustMaxCompletionTokens";
          };
      events: {
        type: "UPDATE_OUTPUTS";
      };
      actors: None;
      guards: None;
    }>,
    initial: "complete",
    after: {
      100: {
        actions: "updateOutput",
      },
    },
    states: {
      complete: {
        entry: ["updateOutput"],
        on: {
          UPDATE_OUTPUTS: {
            actions: ["updateOutput"],
          },
          UPDATE_SOCKET: {
            actions: enqueueActions(({ enqueue }) => {
              enqueue("updateSocket");
              enqueue("updateOutput");
            }),
          },
          SET_VALUE: {
            actions: enqueueActions(({ enqueue }) => {
              enqueue("setValue");
              enqueue("updateOutput");
            }),
            reenter: true,
          },
        },
      },
    },
  },
  {
    actions: {
      adjustMaxCompletionTokens: assign({
        inputSockets: ({ event, context }) => {
          if (event.type !== "SET_VALUE") return context.inputSockets;
          if (event.values.model) {
            return {
              ...context.inputSockets,
              maxCompletionTokens: {
                ...context.inputSockets.maxCompletionTokens!,
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
      updateOutput: enqueueActions(({ enqueue, context }) => {
        console.log("updateOutput", context);
        enqueue.assign({
          outputs: ({ context }) => {
            const api = {
              baseUrl: "https://api.openai.com/v1",
              headers: {
                Authorization:
                  "Bearer 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",
              },
            } as BaseUrlPartsApiConfigurationOptions;
            return {
              ...context.outputs,
              config: {
                provider: "openai",
                apiConfiguration: api,
                ...context.inputs,
              } as OpenAIModelConfig,
            };
          },
        });
      }),
    },
  },
);

export type OpenaiModelNode = ParsedNode<
  "NodeOpenAI",
  typeof OpenaiModelMachine
>;

export class NodeOpenAI extends BaseNode<typeof OpenaiModelMachine> {
  static nodeType = "OpenAI";
  static label = "OpenAI";
  static description = "OpenAI model configuration";

  static icon = "openAI";
  static section = "Model Providers";

  static parse = (
    params: SetOptional<OpenaiModelNode, "type">,
  ): OpenaiModelNode => {
    return {
      ...params,
      type: "NodeOpenAI",
    };
  };

  static machines = {
    NodeOpenAI: OpenaiModelMachine,
  };

  constructor(di: DiContainer, data: OpenaiModelNode) {
    super("NodeOpenAI", di, data, OpenaiModelMachine, {});
  }
}
