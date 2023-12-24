import { merge } from "lodash-es";
import {
  generateText,
  ollama,
  OllamaChatModelSettings,
  openai,
  OPENAI_CHAT_MODELS,
  OpenAIChatSettings,
} from "modelfusion";
import dedent from "ts-dedent";
import { match, P } from "ts-pattern";
import { SetOptional } from "type-fest";
import { assign, createMachine, enqueueActions, fromPromise } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { MappedType } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, None, ParsedNode } from "../base";
import { OllamaModelMachine } from "../ollama/ollama";

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
  llm: generateSocket({
    "x-key": "llm",
    name: "Language Model",
    title: "Language Model",
    type: "object",
    "x-compatible": ["Ollama"],
    description: dedent`
    The language model to use for generating text. 
    `,
    "x-actor-type": "Ollama",
    "x-actor-connections": {
      config: "llm",
    },
    "x-actor-config": {
      // FOR INTERNAL
      config: "llm",
    },
    "x-showSocket": true,
    isMultiple: false,
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

  // model: generateSocket({
  //   "x-key": "model",
  //   name: "model" as const,
  //   title: "Model",
  //   type: "string" as const,
  //   allOf: [
  //     {
  //       enum: Object.keys(OPENAI_CHAT_MODELS),
  //       type: "string" as const,
  //     },
  //   ],
  //   "x-controller": "select",
  //   default: "gpt-3.5-turbo-1106",
  //   description: dedent`
  //   The model to use for generating text. You can see available models
  //   `,
  // }),
  // temperature: generateSocket({
  //   "x-key": "temperature",
  //   name: "temperature" as const,
  //   title: "Temperature",
  //   type: "number" as const,
  //   description: dedent`
  //   The sampling temperature, between 0 and 1. Higher values like
  //   0.8 will make the output more random, while lower values like
  //   0.2 will make it more focused and deterministic. If set to 0,
  //   the model will use log probability to automatically increase
  //   the temperature until certain thresholds are hit`,
  //   required: true,
  //   default: 0.7,
  //   minimum: 0,
  //   maximum: 1,
  //   isMultiple: false,
  //   "x-showSocket": false,
  // }),
  // maxCompletionTokens: generateSocket({
  //   "x-key": "maxCompletionTokens",
  //   name: "maxCompletionTokens" as const,
  //   title: "Max Completion Tokens",
  //   type: "number" as const,
  //   description: dedent`
  //   The maximum number of tokens to generate in the chat
  //   completion. The total length of input tokens and generated
  //   tokens is limited by the model's context length.`,
  //   required: true,
  //   default: 1000,
  //   minimum: 0,
  //   maximum: 4141,
  //   isMultiple: false,
  //   "x-showSocket": false,
  // }),
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

const OpenAIGenerateTextMachine = createMachine({
  id: "openai-generate-text",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          RUN: undefined,
          system: "",
          user: "",
          llm: null,
          // temperature: 0.7,
          // model: "gpt-3.5-turbo-1106",
          // maxCompletionTokens: 1000,
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
    input: {
      inputs: MappedType<typeof inputSockets>;
      outputs: MappedType<typeof outputSockets>;
    };
    context: {
      inputs: MappedType<typeof inputSockets>;
      outputs: MappedType<typeof outputSockets>;
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
      logic: typeof generateTextActor;
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
          // actions: ["setValue"],
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
            llm: context.inputs.llm! as
              | (OllamaChatModelSettings & { provider: "ollama" })
              | (OpenAIChatSettings & { provider: "openai" }),
            system: context.inputs.system!,
            user: context.inputs.user!,
          };
        },
        onDone: {
          target: "#openai-generate-text.idle",
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({
              outputs: ({ event }) => event.output,
            });
            enqueue({
              type: "triggerSuccessors",
              params: {
                port: "onDone",
              },
            });
          }),
        },
        onError: {
          target: "#openai-generate-text.error",
          actions: ["setError"],
        },
      },
    },
    complete: {},
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
});

export type OpenAIGenerateTextNode = ParsedNode<
  "OpenAIGenerateText",
  typeof OpenAIGenerateTextMachine
>;

type GenerateTextInput = {
  llm:
    | (OpenAIChatSettings & { provider: "openai" })
    | (OllamaChatModelSettings & { provider: "ollama" });
  system: string;
  user: string;
};

const generateTextActor = fromPromise(
  async ({ input }: { input: GenerateTextInput }) => {
    console.log("INPUT", input);
    const model = match(input.llm)
      .with(
        {
          provider: "ollama",
        },
        (config) => {
          return ollama.ChatTextGenerator(config);
        },
      )
      .with(
        {
          provider: "openai",
        },
        (config) => {
          return openai.ChatTextGenerator(config);
        },
      )
      .exhaustive();
    try {
      const text = await generateText(model, [
        {
          role: "system",
          content: input.system,
        },
        {
          role: "user",
          content: input.user,
        },
      ]);
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
  },
);

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

  constructor(di: DiContainer, data: OpenAIGenerateTextNode) {
    super("OpenAIGenerateText", di, data, OpenAIGenerateTextMachine, {
      actors: {
        generateText: generateTextActor,
      },
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
      },
    });
    this.extendMachine({
      actors: {
        Ollama: OllamaModelMachine.provide({
          actions: {
            ...this.baseActions,
          },
        }),
      },
    });
    this.setup();
  }
}
