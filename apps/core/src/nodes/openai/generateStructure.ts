import { merge } from "lodash-es";
import {
  BaseUrlApiConfiguration,
  ChatMLPrompt,
  generateStructure,
  jsonStructurePrompt,
  ollama,
  openai,
  UncheckedSchema,
} from "modelfusion";
import dedent from "ts-dedent";
import { match } from "ts-pattern";
import { SetOptional } from "type-fest";
import { createMachine, enqueueActions, fromPromise } from "xstate";

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
import { OllamaModelConfig, OllamaModelMachine } from "../ollama/ollama";
import { OpenAIModelConfig, OpenaiModelMachine } from "./openai";

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
  user: generateSocket({
    name: "user" as const,
    type: "string" as const,
    description: "User Prompt",
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
    context: BaseContextType<typeof inputSockets, typeof outputSockets>;
    actions: None;
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
            llm: context.inputs.llm! as OpenAIModelConfig | OllamaModelConfig,
            method: context.inputs.method!,
            system: context.inputs.system,
            user: context.inputs.user,
            schema: context.inputs.schema,
          };
        },
        onDone: {
          target: "#openai-generate-structure.idle",
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
          target: "#openai-generate-structure.error",
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
          target: "idle",
        },
      },
    },
  },
});

export type OpenAIGenerateStructureNode = ParsedNode<
  "GenerateStructure",
  typeof OpenAIGenerateStructureMachine
>;

type GenerateStructureInput = {
  llm: OpenAIModelConfig | OllamaModelConfig;
  method: "json" | "functionCall";
  system?: string;
  user?: string;
  schema: Tool;
};

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
                instruction: input?.user || "",
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
                instruction: input?.user || "",
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
                instruction: input?.user || "",
              },
              // [
              //   ...(input.system
              //     ? [
              //         {
              //           role: "system" as const,
              //           content: input.system,
              //         },
              //       ]
              //     : []),
              //   ...(input.user
              //     ? [{ role: "user" as const, content: input.user }]
              //     : []),
              // ],
            );
        },
      )
      .run();
    const structure = await model();

    return {
      result: structure,
    };
  },
);

export class GenerateStructure extends BaseNode<
  typeof OpenAIGenerateStructureMachine
> {
  static nodeType = "OpenAIGenerateStructure";
  static label = "Generate Structure";
  static description = "Use LLMs to create a structed data";
  static icon = "openAI";

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
        generateStructure: generateStructureActor,
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
