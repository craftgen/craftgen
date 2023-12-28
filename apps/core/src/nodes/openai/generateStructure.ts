import { merge } from "lodash-es";
import {
  generateStructure,
  ollama,
  OllamaChatModelSettings,
  openai,
  OpenAIChatSettings,
  UncheckedSchema,
} from "modelfusion";
import dedent from "ts-dedent";
import { match } from "ts-pattern";
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

export type OpenAIGenerateStructureNode = ParsedNode<
  "GenerateStructure",
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

const generateStructureActor = fromPromise(
  async ({ input }: { input: GenerateStructureInput }) => {
    console.log("@@@", { input });

    const model = match(input.llm)
      // .with(
      //   {
      //     provider: "ollama",
      //   },
      //   (config) => {
      //     return ollama.ChatTextGenerator(config);
      //     // .asStructureGenerationModel(
      //     //   // Instruct the model to generate a JSON object that matches the given schema.
      //     //   jsonStructurePrompt((instruction: string, schema) => ({
      //     //     system:
      //     //       "JSON schema: \n" +
      //     //       JSON.stringify(schema.getJsonSchema()) +
      //     //       "\n\n" +
      //     //       "Respond only using JSON that matches the above schema.",
      //     //     instruction,
      //     //   }));
      //   },
      // )
      .with(
        {
          provider: "openai",
        },
        (config) => {
          return openai
            .ChatTextGenerator(config)
            .asFunctionCallStructureGenerationModel({
              fnName: input.schema.name,
              fnDescription: input.schema.description,
            });
          // .withInstructionPrompt();
        },
      )
      .run();
    // .exhaustive();

    const structure = await generateStructure(
      model,
      new UncheckedSchema(input.schema.schema),
      [
        {
          role: "system",
          content: input.system,
        },
        {
          role: "user",
          content: input.user,
        },
      ],
    );
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
