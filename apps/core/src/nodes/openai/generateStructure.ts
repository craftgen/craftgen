import { merge } from "lodash-es";
import {
  generateStructure,
  OllamaChatModelSettings,
  openai,
  OPENAI_CHAT_MODELS,
  OpenAIApiConfiguration,
  OpenAIChatMessage,
  OpenAIChatSettings,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
  UncheckedSchema,
} from "modelfusion";
import dedent from "ts-dedent";
import { SetOptional } from "type-fest";
import { assign, createMachine, enqueueActions, fromPromise } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { Tool } from "../../sockets";
import { DiContainer } from "../../types";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  None,
  ParsedNode,
} from "../base";
import { OllamaModelMachine } from "../ollama/ollama";
import { OpenaiModelMachine } from "./openai";

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
};

const outputSockets = {
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
    context: BaseContextType<typeof inputSockets, typeof outputSockets>;
    actions: None;
    events: {
      type: "UPDATE_CHILD_ACTORS";
    };
    actors: {
      src: "generateText";
      logic: ReturnType<typeof generateStructureActor>;
    };
    guards: None;
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        RUN: {
          target: "running",
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
    running: {
      invoke: {
        src: "generateStructure",
        input: ({ context }): GenerateStructureInput => {
          return {
            llm: context.inputs.llm! as
            | (OllamaChatModelSettings & { provider: "ollama" })
            | (OpenAIChatSettings & { provider: "openai" }),
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
  llm:
    | (OpenAIChatSettings & { provider: "openai" })
    | (OllamaChatModelSettings & { provider: "ollama" });
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
      new UncheckedSchema({
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
