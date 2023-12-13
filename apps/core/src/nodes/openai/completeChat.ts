import { createId } from "@paralleldrive/cuid2";
import { merge } from "lodash-es";
import {
  generateText,
  openai,
  OPENAI_CHAT_MODELS,
  OpenAIApiConfiguration,
  OpenAIChatMessage,
  OpenAIChatSettings,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
} from "modelfusion";
import { MessageCreateParams } from "openai/resources/beta/threads/messages/messages.mjs";
import dedent from "ts-dedent";
import { assign, createMachine, enqueueActions, fromPromise, log } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { DiContainer } from "../../types";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  None,
  ParsedNode,
} from "../base";

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
    "x-controller": "textarea",
    title: "System Message",
    "x-showSocket": true,
    "x-key": "system",
  }),
  messages: generateSocket({
    name: "Messages",
    description: "Thread of messages",
    "x-showSocket": false,
    "x-key": "messages",
    type: "array",
    "x-controller": "thread",
    isMultiple: false,
    default: [],
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
  messages: generateSocket({
    name: "messages",
    type: "array",
    isMultiple: true,
    "x-key": "messages",
    "x-showSocket": true,
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

const OpenAICompleteChatMachine = createMachine({
  id: "openai-complete-chat",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          RUN: undefined,
          system: "",
          messages: [],
          temperature: 0.7,
          model: "gpt-3.5-turbo-1106",
          maxCompletionTokens: 1000,
        },
        outputs: {
          onDone: undefined,
          result: "",
          messages: [],
        },
        inputSockets: {
          ...inputSockets,
        },
        outputSockets: {
          ...outputSockets,
        },
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: BaseInputType<typeof inputSockets, typeof outputSockets>;
    context: BaseContextType<typeof inputSockets, typeof outputSockets>;
    actions:
      | {
          type: "adjustMaxCompletionTokens";
        }
      | {
          type: "updateOutputMessages";
        }
      | {
          type: "addMessage";
          params: OpenAIChatMessage;
        };
    events:
      | {
          type: "CONFIG_CHANGE";
          openai: OpenAIChatSettings;
        }
      | {
          type: "CLEAR_THREAD";
        }
      | {
          type: "ADD_MESSAGE";
          params: OpenAIChatMessage;
        }
      | {
          type: "ADD_AND_RUN_MESSAGE";
          params: MessageCreateParams;
        };
    guards: None;
    actors: {
      src: "completeChat";
      logic: ReturnType<typeof completeChatActor>;
    };
  }>,
  initial: "idle",
  states: {
    idle: {
      entry: ["updateOutputMessages"],
      on: {
        ADD_MESSAGE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue({
              type: "addMessage",
              params: ({ event }) => ({
                content: event.params.content,
                role: event.params.role,
              }),
            });
            enqueue({
              type: "updateOutputMessages",
            });
          }),
          reenter: true,
        },
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        RUN: {
          target: "running",
        },
        SET_VALUE: {
          actions: ["setValue", "adjustMaxCompletionTokens"],
        },
        ADD_AND_RUN_MESSAGE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue({
              type: "addMessage",
              params: ({ event }) => ({
                content: event.params.content,
                role: event.params.role,
              }),
            });
            enqueue({
              type: "updateOutputMessages",
            });
          }),
          target: "running",
          reenter: true,
        },
        CLEAR_THREAD: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({
              inputs: ({ context }) => {
                return {
                  ...context.inputs,
                  messages: [],
                };
              },
            });
            enqueue({
              type: "updateOutputMessages",
            });
          }),
          reenter: true,
        },
      },
    },
    running: {
      invoke: {
        src: "completeChat",
        input: ({ context }): CompleteChatInput => {
          return {
            openai: {
              model: context.inputs.model as keyof typeof OPENAI_CHAT_MODELS,
              temperature: context.inputs.temperature!,
              maxCompletionTokens: context.inputs.maxCompletionTokens!,
            },
            system: context.inputs.system!,
            messages: context.inputs.messages?.map(({ id, ...rest }) => {
              return rest;
            }) as OpenAIChatMessage[],
          };
        },
        onDone: {
          target: "#openai-complete-chat.idle",
          actions: enqueueActions(({ enqueue }) => {
            enqueue({
              type: "addMessage",
              params: ({ event }) => ({
                content: event.output.result,
                role: "assistant",
              }),
            });
            enqueue.assign({
              outputs: ({ context, event }) => {
                return {
                  ...context.outputs,
                  result: event.output.result,
                };
              },
            });
          }),
        },
        onError: {
          target: "#openai-complete-chat.error",
          actions: ["setError"],
        },
      },
    },
    complete: {},
    error: {},
  },
});

export type OpenAICompleteChatData = ParsedNode<
  "OpenAICompleteChat",
  typeof OpenAICompleteChatMachine
>;

type CompleteChatInput = {
  openai: OpenAIChatSettings;
  system: string;
  messages: OpenAIChatMessage[];
};

const completeChatActor = ({ api }: { api: () => OpenAIApiConfiguration }) =>
  fromPromise(async ({ input }: { input: CompleteChatInput }) => {
    console.log("INPUT", input);

    try {
      const text = await generateText(
        openai.ChatTextGenerator({
          api: api(),
          ...input.openai,
        }),
        [
          ...(input.system ? [OpenAIChatMessage.system(input.system)] : []),
          ...input.messages,
        ],
      );
      console.log("TEXT", text);
      return {
        result: text,
      };
    } catch (err) {
      console.log("EEEEEE", err);
      return {
        result: "EEEEEE",
      };
    }
  });
export class OpenAICompleteChat extends BaseNode<
  typeof OpenAICompleteChatMachine
> {
  static nodeType = "OpenAICompleteChat";
  static label = "OpenAI Complete Chat";
  static description = dedent`
    OpenAI Complete Chat
  `;
  static icon = "openAI";

  static section = "OpenAI";

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

  constructor(di: DiContainer, data: OpenAICompleteChatData) {
    super("OpenAICompleteChat", di, data, OpenAICompleteChatMachine, {
      actors: {
        completeChat: completeChatActor({ api: () => this.apiModel }),
      },
      actions: {
        updateOutputMessages: assign({
          outputs: ({ context }) => {
            return {
              ...context.outputs,
              messages: context.inputs.messages,
            };
          },
        }),
        addMessage: assign({
          inputs: ({ context }, params) => {
            const id = `message_${createId()}`;
            return {
              ...context.inputs,
              messages: [
                ...context.inputs.messages,
                {
                  id,
                  ...params,
                },
              ],
            };
          },
        }),
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
      },
    });
  }
}
