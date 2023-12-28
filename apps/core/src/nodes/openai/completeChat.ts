import { isNil, merge } from "lodash-es";
import {
  generateText,
  ollama,
  OllamaChatModelSettings,
  openai,
  OPENAI_CHAT_MODELS,
  OpenAIApiConfiguration,
  OpenAIChatMessage,
  OpenAIChatSettings,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
} from "modelfusion";
import dedent from "ts-dedent";
import { match } from "ts-pattern";
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
import { OllamaModelMachine } from "../ollama/ollama";
import {
  ThreadMachine,
  ThreadMachineEvent,
  ThreadMachineEvents,
} from "../thread";
import { OpenaiModelMachine } from "./openai";

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
    "x-showSocket": true,
    "x-key": "messages",
    type: "array",
    allOf: [
      {
        enum: ["Thread"],
        type: "string" as const,
      },
    ],
    "x-controller": "select",
    "x-actor-type": "Thread",
    "x-actor-config": {
      Thread: {
        connections: {
          messages: "messages",
        },
        internal: {
          messages: "messages",
          onRun: "RUN",
        },
      },
    },
    isMultiple: false,
    default: [],
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
  entry: enqueueActions(({ enqueue, context }) => {
    enqueue("spawnInputActors");
    enqueue("setupInternalActorConnections");
  }),
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          RUN: undefined,
          system: "",
          messages: [],
          llm: null,
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
        };
    events: ThreadMachineEvent;
    guards: None;
    actors: {
      src: "completeChat";
      logic: typeof completeChatActor;
    };
  }>,
  initial: "idle",
  states: {
    idle: {
      // entry: ["updateOutputMessages"],
      on: {
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        RUN: {
          target: "running",
          guard: ({ context }) => {
            return (context.inputs.messages || []).length > 0;
          },
        },
        SET_VALUE: {
          actions: enqueueActions(({ enqueue, check }) => {
            enqueue("setValue");
            enqueue("adjustMaxCompletionTokens");
          }),
        },
      },
    },
    running: {
      invoke: {
        src: "completeChat",
        input: ({ context }): CompleteChatInput => {
          console.log("CONTEXT", context);

          return {
            llm: context.inputs.llm! as
              | (OllamaChatModelSettings & { provider: "ollama" })
              | (OpenAIChatSettings & { provider: "openai" }),
            system: context.inputs.system!,
            messages: context.inputs.messages?.map(({ id, ...rest }) => {
              return rest;
            }) as OpenAIChatMessage[],
          };
        },
        onDone: {
          target: "#openai-complete-chat.idle",
          actions: enqueueActions(({ enqueue, check }) => {
            if (
              check(
                ({ context }) =>
                  !isNil(context.inputSockets.messages["x-actor-ref"]),
              )
            ) {
              enqueue.sendTo(
                ({ context }) => context.inputSockets.messages["x-actor-ref"],
                ({ context, event }) => ({
                  type: ThreadMachineEvents.addMessage,
                  params: {
                    content: event.output.result,
                    role: "assistant",
                  },
                }),
              );
            }
            enqueue.assign({
              outputs: ({ context, event }) => {
                return {
                  ...context.outputs,
                  result: event.output.result,
                };
              },
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
  "CompleteChat",
  typeof OpenAICompleteChatMachine
>;

type CompleteChatInput = {
  llm:
    | (OpenAIChatSettings & { provider: "openai" })
    | (OllamaChatModelSettings & { provider: "ollama" });
  system: string;
  messages: OpenAIChatMessage[];
};

const completeChatActor = fromPromise(
  async ({ input }: { input: CompleteChatInput }) => {
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
        ...(input.system ? [OpenAIChatMessage.system(input.system)] : []),
        ...input.messages,
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

export class CompleteChat extends BaseNode<typeof OpenAICompleteChatMachine> {
  static nodeType = "OpenAICompleteChat";
  static label = "OpenAI Complete Chat";
  static description = dedent`
    Use LLMs to complete a chat. 
  `;
  static icon = "openAI";

  static section = "Functions";

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
    super("CompleteChat", di, data, OpenAICompleteChatMachine, {});
    this.extendMachine({
      actors: {
        completeChat: completeChatActor,
        Thread: ThreadMachine.provide({ actions: this.baseActions }),
      },
      actions: {
        updateOutputMessages: assign({
          outputs: ({ context }) => {
            return {
              ...context.outputs,
              messages: context.inputs.thread,
            };
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
