import { merge } from "lodash-es";
import {
  BaseUrlApiConfiguration,
  generateText,
  ollama,
  OllamaChatModelSettings,
  openai,
  OpenAIChatSettings,
} from "modelfusion";
import dedent from "ts-dedent";
import { match } from "ts-pattern";
import { SetOptional } from "type-fest";
import { createMachine, enqueueActions, fromPromise } from "xstate";

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
import { OllamaModelConfig, OllamaModelMachine } from "../ollama/ollama";
import { OpenAIModelConfig, OpenaiModelMachine } from "../openai/openai";

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
          user: "",
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
    context: BaseContextType<typeof inputSockets, typeof outputSockets>;
    actions: None;
    events: {
      type: "UPDATE_CHILD_ACTORS";
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
        UPDATE_CHILD_ACTORS: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("spawnInputActors");
            enqueue("setupInternalActorConnections");
          }),
        },
        RUN: {
          target: "running",
        },
        SET_VALUE: {
          actions: ["setValue"],
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
        },
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
  },
});

export type GenerateTextNode = ParsedNode<
  "GenerateText",
  typeof GenerateTextMachine
>;

type GenerateTextInput = {
  llm: OpenAIModelConfig | OllamaModelConfig;
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
          return openai.ChatTextGenerator({
            ...config,
            api: new BaseUrlApiConfiguration(config.apiConfiguration),
          });
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

  constructor(di: DiContainer, data: GenerateTextNode) {
    super("GenerateText", di, data, GenerateTextMachine, {
      actors: {
        generateText: generateTextActor,
      },
    });
    this.extendMachine({
      actors: {
        Ollama: OllamaModelMachine.provide({
          actions: {
            ...this.baseActions,
          },
        }),
        OpenAI: OpenaiModelMachine.provide({
          actions: {
            ...this.baseActions,
          },
        }),
      },
    });
    this.setup();
  }
}
