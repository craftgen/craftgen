import ky from "ky";
import { isNil } from "lodash-es";
import type { OllamaProviderSettings } from "ollama-ai-provider";
import dedent from "ts-dedent";
import type { SetOptional } from "type-fest";
import {
  ActorRefFrom,
  createMachine,
  enqueueActions,
  fromPromise,
} from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { getSocket } from "../../sockets";
import { ApiConfigurationMachine } from "../apiConfiguration";
import {
  BaseNode,
  NodeContextFactory,
  type BaseContextType,
  type BaseInputType,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "../base";
import { OllamaNetworkError } from "./OllamaNetworkError";

const isNetworkError = (error: any) => {
  if (error.message.includes("TypeError: Failed to fetch")) {
    return true;
  }
};

const OllamaApi = ky.create({
  prefixUrl: "http://127.0.0.1:11434/api",
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set("Content-Type", "application/json");
      },
    ],
    beforeRetry: [
      async ({ error }) => {
        console.log("RETYRY", error);
        if (!isNetworkError(error)) {
          throw new OllamaNetworkError(error.message);
        }
      },
    ],
  },
  retry: {
    limit: 10, // Number of retry attempts
    backoffLimit: 1000, // Time between the retry attempts
    methods: ["get"], // Methods to retry
    statusCodes: [0], // Include network errors (status code 0)
  },
});

const OllamaRegistry = ky.create({
  prefixUrl: "https://registry.ollama.ai/v2",
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set(
          "Accept",
          "application/vnd.docker.distribution.manifest.v2+json",
        );
      },
    ],
  },
});

declare interface ModelResponse {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: ModelDetails;
}

declare interface ModelDetails {
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}
declare interface ShowResponse {
  license?: string;
  modelfile?: string;
  parameters?: string;
  template?: string;
  system?: string;
  details?: ModelDetails;
}

const getModels = fromPromise(
  async (): Promise<{ models: ModelResponse[] } | undefined> => {
    try {
      const respose = await OllamaApi.get("tags");
      console.log("@MODELS", respose);

      if (!respose.ok) {
        if (respose.status === 404) {
          throw new Error("Ollama not running");
        }
        if (respose.status === 403) {
          throw new Error("Ollama CORS not set");
        }
      }
      return respose.json();
    } catch (err) {
      console.log("@ERROR", err);
      throw err;
    }
  },
);

const checkModel = fromPromise(
  async ({ input }: { input: { modelName: string } }): Promise<boolean> => {
    const model = await OllamaRegistry.get(input.modelName);
    return model.status === 200;
  },
);

const getModel = fromPromise(
  async ({
    input,
  }: {
    input: { modelName: string };
  }): Promise<ShowResponse> => {
    const model = await OllamaApi.post("show", {
      json: {
        name: input.modelName,
      },
    });
    return model.json();
  },
);

const listModels = fromPromise(
  async (): Promise<{ models: ModelResponse[] }> => {
    const models = await OllamaApi.get("_catalog", {
      searchParams: {
        n: 1000,
      },
    });
    return models.json();
  },
);

const inputSockets = {
  apiConfiguration: generateSocket({
    "x-key": "apiConfiguration",
    name: "api" as const,
    title: "API Configuration",
    type: "NodeApiConfiguration",
    description: dedent`
    Api configuration for Ollama
    `,
    required: true,
    "x-actor-type": "NodeApiConfiguration",
    default: {
      baseUrl: "http://127.0.0.1:11434",
    },
    isMultiple: false,
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
    name: "model" as const,
    "x-key": "model",
    title: "Select Model",
    type: "string" as const,
    allOf: [
      {
        enum: [],
        type: "string",
      },
    ],
    required: true,
    isMultiple: false,
    "x-showSocket": true,
    "x-controller": "combobox",
    description: dedent`
    Ollama model to use
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
  mirostat: generateSocket({
    "x-key": "mirostat",
    name: "mirostat" as const,
    title: "Mirostat",
    type: "number",
    description: dedent`
    Enable Mirostat sampling for controlling perplexity.
    (default: 0, 0 = disabled, 1 = Mirostat, 2 = Mirostat 2.0)
    `,
    allOf: [
      {
        enum: [0, 1, 2],
        type: "number",
      },
    ],
    required: false,
    default: 0,
    isMultiple: false,
    "x-isAdvanced": true,
    "x-controller": "select",
    "x-showSocket": false,
  }),
  mirostatEta: generateSocket({
    "x-key": "mirostatEta",
    name: "mirostatEta" as const,
    title: "Mirostat Eta",
    type: "number" as const,
    description: dedent`
    Influences how quickly the algorithm responds to feedback from the generated text.
    A lower learning rate will result in slower adjustments,
    while a higher learning rate will make the algorithm more responsive. (Default: 0.1)
    `,
    required: false,
    default: 0.1,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  mirostatTau: generateSocket({
    "x-key": "mirostatTau",
    name: "mirostatTau" as const,
    title: "Mirostat Tau",
    type: "number" as const,
    description: dedent`
    Controls the balance between coherence and diversity of the output.
    A lower value will result in more focused and coherent text. (Default: 5.0)
    `,
    required: false,
    default: 5.0,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  numGqa: generateSocket({
    "x-key": "numGqa",
    name: "numGqa" as const,
    title: "Num Gqa",
    type: "number" as const,
    description: dedent`
    The number of GQA groups in the transformer layer. Required for some models,
    for example it is 8 for llama2:70b
    `,
    required: false,
    default: 8,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  numGpu: generateSocket({
    "x-key": "numGpu",
    name: "numGpu" as const,
    title: "Num Gpu",
    type: "number" as const,
    description: dedent`
    The number of layers to send to the GPU(s). On macOS it defaults to 1 to
    enable metal support, 0 to disable.
    `,
    required: false,
    default: 1,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  numThreads: generateSocket({
    "x-key": "numThreads",
    name: "numThreads" as const,
    title: "Num Threads",
    type: "number" as const,
    description: dedent`
    Sets the number of threads to use during computation. By default, Ollama will
    detect this for optimal performance. It is recommended to set this value to the
    number of physical CPU cores your system has (as opposed to the logical number of cores).
    `,
    required: false,
    default: undefined,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  repeatLastN: generateSocket({
    "x-key": "repeatLastN",
    name: "repeatLastN" as const,
    title: "Repeat Last N",
    type: "number" as const,
    description: dedent`
    Sets how far back for the model to look back to prevent repetition.
    (Default: 64, 0 = disabled, -1 = num_ctx)
    `,
    required: false,
    default: 64,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  repeatPenalty: generateSocket({
    "x-key": "repeatPenalty",
    name: "repeatPenalty" as const,
    title: "Repeat Penalty",
    type: "number" as const,
    description: dedent`
    Sets how strongly to penalize repetitions. A higher value (e.g., 1.5)
    will penalize repetitions more strongly, while a lower value (e.g., 0.9)
    will be more lenient. (Default: 1.1)
    `,
    required: false,
    default: 1.1,
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
    Sets the random number seed to use for generation. Setting this to a
    specific number will make the model generate the same text for the same prompt.
    `,
    required: false,
    default: undefined,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  tfsZ: generateSocket({
    "x-key": "tfsZ",
    name: "tfsZ" as const,
    title: "Tfs Z",
    type: "number" as const,
    description: dedent`
    Tail free sampling is used to reduce the impact of less probable tokens
    from the output. A higher value (e.g., 2.0) will reduce the impact more,
    while a value of 1.0 disables this setting. (default: 1)
    `,
    required: false,
    default: 1,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  topK: generateSocket({
    "x-key": "topK",
    name: "topK" as const,
    title: "Top K",
    type: "number" as const,
    description: dedent`
    Reduces the probability of generating nonsense. A higher value (e.g. 100)
    will give more diverse answers, while a lower value (e.g. 10) will be more
     conservative. (Default: 40)
    `,
    required: false,
    default: 40,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  topP: generateSocket({
    "x-key": "topP",
    name: "topP" as const,
    title: "Top P",
    type: "number" as const,
    description: dedent`
    Works together with top-k. A higher value (e.g., 0.95) will lead to more
    diverse text, while a lower value (e.g., 0.5) will generate more focused
    and conservative text. (Default: 0.9)
    `,
    required: false,
    default: 0.9,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  format: generateSocket({
    "x-key": "format",
    name: "format" as const,
    title: "Format",
    type: "string" as const,
    description: dedent`
    The format to return a response in. Currently the only accepted value is 'json'.
    Leave undefined to return a string.
    `,
    allOf: [
      {
        enum: ["json"],
        type: "string",
      },
    ],
    "x-controller": "select",
    required: false,
    default: undefined,
    isMultiple: false,
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  template: generateSocket({
    "x-key": "template",
    name: "template" as const,
    title: "Template",
    type: "string" as const,
    description: dedent`
    Template to use for generation
    `,
    required: false,
    default: undefined,
    isMultiple: false,
    format: "expression",
    "x-controller": "code",
    "x-language": "handlebars",
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
  modelfile: generateSocket({
    "x-key": "modelfile",
    name: "modelfile" as const,
    description: "Model file",
    "x-controller": "code",
    type: "string",
    required: false,
    default: undefined,
    isMultiple: false,
    format: "expression",
    "x-language": "handlebars",
    "x-showSocket": false,
    "x-isAdvanced": true,
  }),
};
const outputSockets = {
  config: generateSocket({
    "x-key": "config",
    name: "config" as const,
    title: "Config",
    type: "object",
    description: dedent`
    Ollama config
    `,
    required: true,
    isMultiple: false,
    "x-showSocket": true,
  }),
};

export const OllamaModelMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QHsA2qCGBbDBaLyEYqAdBgMYAuAlsgHYD6ATmAI4Cu1LEAxBPWBLU6AN2QBrQWkw58hYmSq1GLDl0gJhY8hhr0A2gAYAukeOJQAB2SxqeuhZAAPRAA4ATAE4SANh-uAdgAWAGYA9yCARh8gnwAaEABPN3dXEk8Av0jIz1yggFYfAIBfYoTpbDwCIlIKe2Y2Tm4eMCYmZCYSS0xKADMOrBIK2WqFOuUGtW5NUWQdezMzR2tbe0cXBHzPfJIgiNjMkMNcyICE5IRXXJJDfMCCz0Noq9dS8vRKuRrFetUmyB4AFUAAoAEQAggAVACiDAA8oDIcDEQBlJZIEArOzKdZuaIkdy3ALZIrHQxBc6IAIhEIkAJPVzhfIhaLMkplEDDKryWpKeiTf68EEQmEMFFwgDCAGloZD0VYbNj6LjLu5IrtwjFotkAvktpSED5siRXJF3PkCltGUFDK8OVyvmM+SpGupeCjZQwAGrggAygOh8sxirWGI2rhCPl2nlcPlNPhC7kJPk8BqCV3S7kTkVjPnyHgCnjenI+Ix5PwmfzdPCDWNDoA2eaCBJphhiV0i2dcBtNJETXmiQXpusM5OLDtGpFQyAwEGEUD4AiEs0kQ1L3O+09n85m2l0ykWJmWIZxYcQWYCNzuhmpndcps85oN23cdM8MT1sT2WaC4-XjqnGc5zoBdWnaTpul0fomEGCdyy3YCoF3OZ9wMExaxPZUzwQC8r0JW8QnvHInySRAcm8dMjmpYlr11dw-xkDcFDAjogTBKFYQRJFUQw1ZTwbRAQmuQjUlHfxGSuPM0wTG5jjNU5PCEs0GM+ScSBYpg2JFWFxWlWVeKVBxsJtZsYgyI5CnfKJ4lIhAQiiEhsgyTx0x8Y5cjHe1-zUjSeA9SFvT9AMDPrZxEC2HY9iCA4E3c0400Iul3DzPMrX8TsQhUstvl8gAlWVcoATRC-iws2bZdn2IpYpOM5bMKQxfEifNH2ZZr7PorzGIAkhyGQLBujASgwC0jj4URZFITRI8MTrUqNiE7wRNcMTUgCSSezzEg9UJPJY3W7IsqY0g+oG1AhpG4Uxt0mU5RmhU+KwgSEBM3wgnM24Uy1fIDWCWk-ECJlmVjDwjp607BuGvzPR9f1A3u4NHqM56om8Ip8gCektlHVqDXSulqWiwpdr1TKutU8sIfOqGSqesqIsq6LqqOWrn08dVEyNIjFMCLxSg5Oh5HgDE4JqY8kZVXAbIuXAdlyeWFcVsn3m6tS+qYWAGA08XDJVXUCUxvJbUs4l3ANTsoyHG9yQZI1AjBtTxn5KtuB10Lw1tAlTj2PIbUxilbMfKNzVHC0B0MIS7RVinNyA+c3fmxA9nNlz0jc1II0x1w7hjB3y212bMORsqClfPNIgjqK-FCaXwpk1JCLto0aMiPPvipi6E7pjYokvRTjlNSMImOH7A62jw40I7YClcPZ+eKIA */
    id: "ollama-model",
    entry: enqueueActions(({ enqueue }) => {
      enqueue("initialize");
    }),
    context: (ctx) =>
      NodeContextFactory(ctx, {
        name: "Ollama Model",
        description: "Ollama Model configuration",
        inputSockets,
        outputSockets,
      }),
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets>;
      context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
        model?: ShowResponse & { name: string };
        childs: {
          apiConfiguration: ActorRefFrom<typeof ApiConfigurationMachine>;
        };
      };
      actions: None;
      events: None;
      actors: {
        src: "getModels";
        logic: typeof getModels;
      };
      guards: None;
    }>,
    initial: "action_required",
    on: {
      ASSIGN_CHILD: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("assignChild");
        }),
      },
      INITIALIZE: {
        actions: ["initialize"],
      },
    },
    states: {
      cors_error: {},
      action_required: {
        on: {
          SET_VALUE: {
            actions: ["setValue"],
            reenter: true,
          },
        },
        always: [
          {
            guard: ({ context }) =>
              !isNil(context.inputs.model) &&
              context.model?.name !== context.inputs.model,
            target: "loading",
          },
        ],
        invoke: {
          src: "getModels",
          onDone: {
            actions: enqueueActions(({ enqueue, event }) => {
              enqueue.sendTo(
                ({ context, system }) =>
                  getSocket({
                    sockets: context.inputSockets,
                    key: "model",
                  }),
                {
                  type: "UPDATE_SOCKET",
                  params: {
                    allOf: [
                      {
                        enum: [
                          ...event.output.models.map(
                            (model: ModelResponse) => model.name,
                          ),
                        ],
                      },
                    ],
                  },
                },
              );
            }),
          },
          onError: {
            target: "error",
            actions: enqueueActions(({ enqueue, event }) => {
              console.log("error", event.error);
              enqueue({
                type: "setError",
                params: {
                  name: "Set CORS for Ollama",
                  message: dedent`
                  Run this command in your terminal and restart Ollama
                  \`\`\`
                  launchctl setenv OLLAMA_ORIGINS 'https://craftgen.ai'
                  \`\`\`
                  `,
                  stack: event.error,
                },
              });
            }),
          },
        },
      },
      loading: {
        always: [
          {
            target: "action_required",
            guard: ({ context }) => isNil(context.inputs.model),
          },
        ],
        invoke: {
          src: "getModel",
          input: ({ context }) => ({
            modelName: context.inputs.model,
          }),
          onDone: {
            target: "#ollama-model.complete",
            actions: enqueueActions(({ enqueue }) => {
              enqueue.assign({
                model: ({ event, context }) => {
                  return {
                    ...event.output,
                    name: context.inputs.model,
                  };
                },
              });
              enqueue.sendTo(
                ({ system, context }) =>
                  getSocket({
                    sockets: context.inputSockets,
                    key: "modelfile",
                  }),
                ({ event }) => ({
                  type: "SET_VALUE",
                  params: {
                    value: event.output.modelfile,
                  },
                }),
              );
              enqueue.sendTo(
                ({ system, context }) =>
                  getSocket({
                    sockets: context.inputSockets,
                    key: "template",
                  }),
                ({ event }) => ({
                  type: "SET_VALUE",
                  params: {
                    value: event.output.template,
                  },
                }),
              );
            }),
          },
          onError: {
            actions: enqueueActions(({ enqueue, event }) => {
              console.log("ERROR", event);
            }),
            target: "error",
          },
        },
      },
      error: {
        on: {
          SET_VALUE: {
            actions: ["setValue"],
            target: "action_required",
          },
          RETRY: {
            target: "#ollama-model.action_required",
          },
        },
      },
      complete: {
        invoke: {
          src: "actorWatcher",
          input: ({ self, context }) => ({
            actor: self,
            stateSelectorPath: "context.inputs",
            event: "COMPUTE",
          }),
        },
        entry: enqueueActions(({ enqueue, context }) => {
          enqueue.raise({ type: "COMPUTE" });
        }),
        always: [
          {
            guard: ({ context }) =>
              context.inputs.model === "" ||
              context.model === undefined ||
              context.model.name !== context.inputs.model,
            target: "action_required",
          },
        ],
        on: {
          SET_VALUE: {
            actions: enqueueActions(({ enqueue, context }) => {
              enqueue("setValue");
            }),
          },

          COMPUTE: {
            actions: enqueueActions(({ enqueue, context, self, event }) => {
              enqueue({
                type: "computeEvent",
                params: {
                  event: "RESULT",
                },
              });
            }),
          },
          RESULT: {
            actions: enqueueActions(({ enqueue, context, event }) => {
              enqueue({
                type: "removeComputation",
              });

              enqueue.assign({
                outputs: ({ event }) => {
                  return {
                    ...event.params.inputs,
                    config: {
                      provider: "ollama",
                      ...event.params.inputs.apiConfiguration,
                      ...event.params.inputs,
                      template: undefined,
                    },
                  };
                },
              });

              enqueue("resolveOutputSockets");
            }),
          },
        },
      },
    },
  },
  {
    actors: {
      getModels,
      getModel,
    },
  },
);

export type OllamaModelConfig = OllamaProviderSettings & {
  provider: "ollama";
};

export type OllamaModelNode = ParsedNode<
  "NodeOllama",
  typeof OllamaModelMachine
>;

export class NodeOllama extends BaseNode<typeof OllamaModelMachine> {
  static nodeType = "Ollama";
  static label = "Ollama";
  static description = "Local Ollama model";

  static icon = "ollama";
  static section = "Model Providers";

  static parse = (params: SetOptional<OllamaModelNode, "type">) => {
    return {
      ...params,
      type: "NodeOllama",
    };
  };

  static machines = {
    NodeOllama: OllamaModelMachine,
  };

  constructor(di: DiContainer, data: OllamaModelNode) {
    super("NodeOllama", di, data, OllamaModelMachine, {});
  }
}
