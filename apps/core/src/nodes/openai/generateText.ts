import dedent from "dedent";
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
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { Input, Output } from "../../input-output";
import { MappedType, triggerSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, None, ParsedNode } from "../base";

const inputSockets = {
  system: generateSocket({
    name: "system" as const,
    type: "string" as const,
    description: "System Message",
    required: false,
    isMultiple: false,
    "x-controller": "textarea",
    title: "System Message",
    "x-showInput": true,
    "x-key": "system",
  }),
  user: generateSocket({
    name: "user" as const,
    type: "string" as const,
    description: "User Prompt",
    required: true,
    isMultiple: false,
    "x-controller": "textarea",
    "x-key": "user",
    "x-showInput": true,
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
    "x-showInput": false,
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
    "x-showInput": false,
  }),
};

const outputSockets = {
  result: generateSocket({
    name: "result" as const,
    type: "string" as const,
    description: "Result of the generation",
    required: true,
    isMultiple: true,
    "x-key": "result",
  }),
};

const OpenAIGenerateTextMachine = createMachine({
  id: "openai-generate-text",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          system: "",
          user: "",
          temperature: 0.7,
          model: "gpt-3.5-turbo-1106",
          maxCompletionTokens: 1000,
        },
        outputs: {
          result: "",
        },
        inputSockets,
        outputSockets,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      inputs: MappedType<typeof inputSockets>;
      outputs: MappedType<typeof outputSockets>;
    };
    context: {
      inputs: MappedType<typeof inputSockets>;
      outputs: MappedType<typeof outputSockets>;
      // settings: {
      //   openai: OpenAIChatSettings;
      // };
    };
    actions: {
      type: "adjustMaxCompletionTokens";
    };
    events: {
      type: "CONFIG_CHANGE";
      openai: OpenAIChatSettings;
    };
    guards: None;
    actors: {
      src: "generateText";
      logic: ReturnType<typeof generateTextActor>;
    };
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        RUN: {
          target: "running",
          actions: ["setValue"],
        },
        SET_VALUE: {
          actions: ["setValue", "adjustMaxCompletionTokens"],
        },
      },
    },
    running: {
      invoke: {
        src: "generateText",
        input: ({ context }): GenerateTextInput => {
          return {
            openai: {
              model: context.inputs.model,
              temperature: context.inputs.temperature,
              maxCompletionTokens: context.inputs.maxCompletionTokens,
            },
            system: context.inputs.system,
            user: context.inputs.user,
          };
        },
        onDone: {
          target: "#openai-generate-text.complete",
          actions: assign({
            outputs: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "#openai-generate-text.error",
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
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
  },
  output: ({ context }) => context.outputs,
});

export type OpenAIGenerateTextNode = ParsedNode<
  "OpenAIGenerateText",
  typeof OpenAIGenerateTextMachine
>;

type GenerateTextInput = {
  openai: OpenAIChatSettings;
  system: string;
  user: string;
};

const generateTextActor = ({ api }: { api: () => OpenAIApiConfiguration }) =>
  fromPromise(async ({ input }: { input: GenerateTextInput }) => {
    console.log("INPUT", input);
    try {
      const text = await generateText(
        openai.ChatTextGenerator({
          api: api(),
          ...input.openai,
        }),
        [
          ...(input.system ? [OpenAIChatMessage.system(input.system)] : []),
          OpenAIChatMessage.user(input.user),
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

export class OpenAIGenerateText extends BaseNode<
  typeof OpenAIGenerateTextMachine
> {
  static nodeType = "OpenAIGenerateText";
  static label = "Generate Text";
  static description = "Usefull for generating text from a prompt";
  static icon = "openAI";

  static section = "OpenAI";

  static parse(
    params: SetOptional<OpenAIGenerateTextNode, "type">,
  ): OpenAIGenerateTextNode {
    return {
      ...params,
      type: "OpenAIGenerateText",
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

  constructor(di: DiContainer, data: OpenAIGenerateTextNode) {
    super("OpenAIGenerateText", di, data, OpenAIGenerateTextMachine, {
      actors: {
        generateText: generateTextActor({ api: () => this.apiModel }),
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
    // this.addControl(
    //   "openai",
    //   new OpenAIChatSettingsControl(
    //     this.actor,
    //     (snap) => snap.context.settings.openai,
    //     {
    //       change: (value) => {
    //         console.log("change", value);
    //         this.actor.send({
    //           type: "CONFIG_CHANGE",
    //           openai: value,
    //         });
    //       },
    //     },
    //   ),
    // );
    // this.addInput("trigger", new Input(triggerSocket, "Exec", true));
    // this.addOutput("trigger", new Output(triggerSocket, "Exec"));
  }
}
