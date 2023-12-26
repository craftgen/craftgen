import ky from "ky";
import { merge } from "lodash-es";
import { ApiConfiguration, ollama, OllamaChatModelSettings } from "modelfusion";
import dedent from "ts-dedent";
import { SetOptional } from "type-fest";
import { assign, createMachine, enqueueActions, fromPromise } from "xstate";

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

const OllamaApi = ky.create({
  prefixUrl: "http://127.0.0.1:11434/api",
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set("Content-Type", "application/json");
      },
    ],
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
  async (): Promise<{ models: ModelResponse[] }> => {
    const models = await OllamaApi.get("tags");
    return models.json();
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
    "x-showSocket": false,
  }),
};
const outputSockets = {
  config: generateSocket({
    "x-key": "config",
    name: "config" as const,
    title: "Config",
    type: "Ollama",
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
    id: "ollama-model",
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
          inputSockets: {
            ...inputSockets,
          },
          outputSockets: {
            ...outputSockets,
          },
          outputs: {},
        },
        input,
      );
    },
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets>;
      context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
        model?: ShowResponse;
      };
      actions: {
        type: "updateOutput";
      };
      // actions: None;
      events: {
        type: "UPDATE_OUTPUTS";
      };
      actors: {
        src: "getModels";
        logic: typeof getModels;
      };
      guards: None;
    }>,
    initial: "idle",
    states: {
      idle: {
        entry: ["updateOutput"],
        on: {
          UPDATE_OUTPUTS: {
            actions: "updateOutput",
          },
          UPDATE_SOCKET: {
            actions: ["updateSocket", "updateOutput"],
          },
          SET_VALUE: {
            actions: ["setValue", "updateOutput"],
            reenter: true,
          },
        },
        always: [
          {
            guard: ({ context }) =>
              context.inputs.model !== undefined && context.model === undefined,
            target: "loading",
          },
          {
            guard: ({ context }) => context.model !== undefined,
            target: "complete",
          },
        ],
        invoke: {
          src: "getModels",
          onDone: {
            actions: enqueueActions(({ enqueue, event }) => {
              enqueue.raise({
                type: "UPDATE_SOCKET",
                params: {
                  name: "model",
                  side: "input",
                  socket: {
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
              });
            }),
          },
        },
      },
      loading: {
        invoke: {
          src: "getModel",
          input: ({ context }) => ({
            modelName: context.inputs.model,
          }),
          onDone: {
            target: "#ollama-model.complete",
            actions: assign({
              model: ({ event }) => event.output,
            }),
          },
          onError: {
            actions: ["setError"],
            target: "idle",
          },
        },
        after: {
          1000: "idle",
        },
      },
      complete: {
        // entry: ["updateOutput"],
        on: {
          UPDATE_OUTPUTS: {
            actions: "updateOutput",
          },
          UPDATE_SOCKET: {
            actions: ["updateSocket", "updateOutput"],
          },
          SET_VALUE: {
            actions: ["setValue", "updateOutput"],
            target: "idle",
            reenter: true,
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
    actions: {
      updateOutput: enqueueActions(({ enqueue, context }) => {
        console.log("updateOutput", context);
        enqueue.assign({
          outputs: ({ context }) => {
            const api = ollama.Api({});
            return {
              ...context.outputs,
              config: {
                provider: "ollama",
                api: api as ApiConfiguration,
                ...context.inputs,
              } as OllamaChatModelSettings,
            };
          },
        });
        const connections = context.outputSockets.config["x-connection"];
        for (const [target, inputKey] of Object.entries(connections || {})) {
          enqueue({
            type: "syncConnection",
            params: {
              nodeId: target,
              outputKey: "config",
              inputKey,
            },
          });
        }
      }),
    },
  },
);

export type OllamaModelNode = ParsedNode<"Ollama", typeof OllamaModelMachine>;

export class Ollama extends BaseNode<typeof OllamaModelMachine> {
  static nodeType = "Ollama";
  static label = "Ollama";
  static description = "Local Ollama model";

  static icon = "ollama";
  static section = "Model Providers";

  static parse = (params: SetOptional<OllamaModelNode, "type">) => {
    return {
      ...params,
      type: "Ollama",
    };
  };

  constructor(di: DiContainer, data: OllamaModelNode) {
    super("Ollama", di, data, OllamaModelMachine, {});
    this.setup();
  }
}
