import { createId } from "@paralleldrive/cuid2";
import { isNil, merge } from "lodash-es";
import {
  BaseUrlApiConfiguration,
  generateObject,
  jsonObjectPrompt,
  ollama,
  openai,
  ToolCallError,
  UncheckedSchema,
} from "modelfusion";
import dedent from "ts-dedent";
import { match } from "ts-pattern";
import type { SetOptional } from "type-fest";
import {
  and,
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
  type OutputFrom,
} from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { Tool } from "../../sockets";
import type { DiContainer } from "../../types";
import {
  BaseNode,
  NodeContextFactory,
  type BaseContextType,
  type BaseInputType,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "../base";
import type { OllamaModelConfig } from "../ollama/ollama";
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
        enum: ["NodeOllama", "NodeOpenAI"],
        type: "string" as const,
      },
    ],
    "x-controller": "select",
    "x-actor-type": "NodeOpenAI",
    "x-actor-config": {
      NodeOllama: {
        connections: {
          config: "llm",
        },
        internal: {
          config: "llm",
        },
      },
      NodeOpenAI: {
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

const GenerateObjectMachine = createMachine({
  id: "generate-object",
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "GenerateObject",
      description: "Generate Object base on the schema",
      inputSockets,
      outputSockets,
    }),
  entry: enqueueActions(({ enqueue }) => {
    enqueue("initialize");
  }),
  types: {} as BaseMachineTypes<{
    input: BaseInputType<typeof inputSockets, typeof outputSockets>;
    context: BaseContextType<typeof inputSockets, typeof outputSockets>;
    actions: None;
    events: None;
    actors: None;
    guards: None;
  }>,
  initial: "idle",
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
    SET_VALUE: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("setValue");
      }),
    },
  },
  states: {
    idle: {
      on: {
        RESULT: {
          actions: enqueueActions(({ enqueue, check, self, event }) => {
            enqueue.assign({
              outputs: ({ context, event }) => ({
                ...context.outputs,
                result: event.params?.res.result,
              }),
            });
            enqueue({
              type: "triggerSuccessors",
              params: {
                port: "onDone",
              },
            });

            enqueue("resolveOutputSockets");
          }),
        },
        RESET: {
          actions: enqueueActions(({ enqueue, context, self }) => {
            enqueue.assign({
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
          actions: enqueueActions(({ enqueue, check, event }) => {
            if (check(({ event }) => event.origin.type !== "compute-event")) {
              enqueue({
                type: "computeEvent",
                params: {
                  event: event.type,
                },
              });
              return;
            }
            enqueue({
              type: "removeComputation",
            });
            const runId = `call_${createId()}`;
            enqueue.sendTo(
              ({ system }) => system.get("editor"),
              ({ self, context }) => ({
                type: "SPAWN_RUN",
                params: {
                  id: runId,
                  parentId: self.id,
                  machineId: "NodeGenerateStructure.run",
                  systemId: runId,
                  input: {
                    inputs: {
                      ...event.params?.inputs,
                      // llm: context.inputs.llm! as
                      //   | OpenAIModelConfig
                      //   | OllamaModelConfig,
                      // method: context.inputs.method!,
                      // system: context.inputs.system,
                      // instruction: context.inputs.instruction,
                      // schema: context.inputs.schema,
                    },
                    senders: [{ id: self.id }],
                    parent: {
                      id: self.id,
                    },
                  },
                  syncSnapshot: true,
                },
              }),
            );
          }),
        },
      },
    },
    complete: {},
    error: {},
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
    console.log("GENERATE_STRUCTURE_ACTOR", { input });
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
            .CompletionTextGenerator({
              ...config,
              api: new BaseUrlApiConfiguration(config.apiConfiguration),
              stream: false,
            })
            .asObjectGenerationModel(
              jsonObjectPrompt.instruction({
                schemaPrefix: `"""\nschema\n`,
                schemaSuffix: `"""\nparameter\n`,
              }),
            );
          return () =>
            generateObject({
              model,
              schema: new UncheckedSchema(input.schema),
              prompt: {
                system: input.system,
                instruction: input?.instruction || "",
              },
              fullResponse: true,
            });
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
            .asObjectGenerationModel(
              jsonObjectPrompt.instruction({
                schemaPrefix: "schema",
                schemaSuffix: "parameters",
              }),
            );
          return () =>
            generateObject({
              model,
              schema: new UncheckedSchema(input.schema),
              prompt: {
                system: input.system,
                instruction: input?.instruction || "",
              },
              fullResponse: true,
            });
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
            .asFunctionCallObjectGenerationModel({
              fnName: input.schema.name,
              fnDescription: input.schema.description,
            })
            .withInstructionPrompt();
          return () =>
            generateObject({
              model,
              schema: new UncheckedSchema(input.schema.parameters),
              prompt: {
                system: input.system,
                instruction: input?.instruction || "",
              },
              fullResponse: true,
            });
        },
      )
      .run();
    console.log("MODEL", model);
    const structure = await model();

    return structure;
  },
);

const generateStructureCall = setup({
  types: {
    input: {} as {
      inputs: GenerateStructureInput;
      senders: {
        id: string;
      }[];
      parent: {
        id: string;
      };
    },
    context: {} as {
      inputs: GenerateStructureInput;
      outputs: null | {
        ok: boolean;
        result: OutputFrom<typeof generateStructureActor> | ToolCallError;
      };
      senders: {
        id: string;
      }[];
      parent: {
        id: string;
      };
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
              enqueue.sendTo(
                ({ system }) => system.get(sender.id),
                ({ context, self }) => ({
                  type: "RESULT",
                  params: {
                    id: self.id,
                    res: context.outputs,
                  },
                }),
              );
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
              enqueue.sendTo(
                ({ system }) => system.get(sender.id),
                ({ context, self }) => ({
                  type: "RESULT",
                  params: {
                    id: self.id,
                    res: context.outputs,
                  },
                }),
              );
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
  "NodeGenerateStructure",
  typeof GenerateObjectMachine
>;

export class NodeGenerateStructure extends BaseNode<
  typeof GenerateObjectMachine
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
      type: "NodeGenerateStructure",
    };
  }
  static machines = {
    NodeGenerateStructure: GenerateObjectMachine,
    "NodeGenerateStructure.run": generateStructureCall,
  };

  constructor(di: DiContainer, data: OpenAIGenerateStructureNode) {
    super("NodeGenerateStructure", di, data, GenerateObjectMachine, {});
  }
}
