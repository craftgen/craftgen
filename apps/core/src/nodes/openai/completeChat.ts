import { isNil, merge } from "lodash-es";
import {
  BaseUrlApiConfiguration,
  ChatMessage,
  generateText,
  generateToolCallsOrText,
  ollama,
  openai,
  OpenAIApiConfiguration,
  OpenAIChatMessage,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
  ToolDefinition,
  UncheckedSchema,
} from "modelfusion";
import dedent from "ts-dedent";
import { match, P } from "ts-pattern";
import {
  AnyActorRef,
  assign,
  createMachine,
  enqueueActions,
  fromPromise,
} from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { Message } from "../../controls/thread.control";
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
import { ThreadMachine } from "../thread";
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
  tools: generateSocket({
    "x-key": "tools",
    name: "Tools",
    title: "Tools",
    type: "tool",
    description: dedent`
    The tools agent to use. 
    `,
    "x-showSocket": true,
    isMultiple: true,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWgGNkBbVAGzABcxCALLSgOhwgoGIBVABQBEBBACoBRAPoBlAPIBhANJCBAbQAMAXUShUyWDko5kGdSAAeiAJwB2RqdMA2AIxKATKYDMdu47vnzAGhABPRDcADkZzT2CPAFYbVzsYgF8EvzRMXEIScioaAnomFnYAJQ4AOWU1JBBNbV19QxMER3NTRiildo9TYKaAFi8ev0CEPtDu4KjIl2sJ0zsklPRsfCJSCmo6BmZWME5eQVEpAAkASQAZHhE+KQEJQrFyw2qdPQNKhvDGdq-v77tBxEcjhcjB6PXMSmCSnMLiUpihUR68xAqSWGVW2Q2+W2bDE8hEADU+KcOEIHpUnrVXqAGh4lGEobE+l9HDYBgFEB5Ql4gT1gsFTI4etYei4kSj0issutcpsAE4AVwwGBwGCgzAwIlQsuQUFlcFgbAg+jA6oAbsgANYm8XLTJrHJ5RgKpUqtUqzXa3X6hAq80EBgvcpkjRaZ51N6IHqA1o9GzBbxxhzBFxsoYiqJhPouFw2CbQkXeMWLCV2jEypjO5Wq9UenV62AGsCy7WyxjkBgAM2QsuIjBtaKlDrliqrbo1Wrr3t9yH9lKDqkeocp9TMs0Ydmsjic0JcMQs-wQUSilns0NhYx6UVMiOSyOLtvR0sdlddNYnXobbCkRNOIhuElOYMqiXF4VwQVk7EYCCBUhFxzCibMXAPS9QijcZOliFNc3MIs0gfQdMSdEdXz1ABHeUcHrEQsAISk2H-X9v1OQCF3JEDw2pRAIKgvoYKUOCEOzZCISg-j2kcK8XGTcIklvDBkAgOBDH7SV7UxRcalAiMEDwGwDzwDMuh+Yy7GCXDUVUstHQKMANLDKljA5UyrC3CZLyUbkbHMP52WGZzrFzUEeihcIcxscyS0fIcK2I1U7OXbSczpON7AsQFwhsKY9N8xx+Rcvld3g6EEKiCL8LU8siJdat3Xfet4DYzSOMc4YRJSjdwiaFksoPQTPjsMFMpsLc7BzMzbxU0sn2Haq1Us6gIHirTOOGKJIIscINwkhxdxzA84Msbb4MBXKdsSCb7wHCrn1itUyIoqiaISkMmoc944UYKZgjQ-jXGsJDfMvYEPN5cxxm+3oczKq6rM2ebbMa+ywKjZDvBBYJ7Fy8wbFiTLTGh+HCKbFsluahpjwPDGWkQhMJlZXL8dkoA */
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
          tools: [
            // {
            //   name: "Math" as const,
            //   description: dedent`
            // A tool for evaluating mathematical expressions. Example expressions:
            // '1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.
            // `,
            //   parameters: {
            //     type: "object",
            //     properties: {
            //       expression: {
            //         type: "string",
            //         description: "The expression to evaluate",
            //       },
            //     },
            //     required: ["expression"],
            //   },
            // },
          ],
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
    events:
      | {
          type: "TOOL_REQUEST";
          params: {
            name: string;
            parameters: any;
          };
        }
      | {
          type: "TOOL_RESULT";
          params: {
            name: string;
            result: any;
          };
        };
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
        UPDATE_CHILD_ACTORS: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("spawnInputActors");
            enqueue("setupInternalActorConnections");
          }),
        },
        SET_VALUE: {
          actions: enqueueActions(({ enqueue, check }) => {
            enqueue("setValue");
          }),
        },
      },
    },
    running: {
      initial: "in_progress",
      states: {
        in_progress: {
          on: {
            TOOL_REQUEST: {
              target: "requires_action",
              actions: enqueueActions(({ enqueue, check, event }) => {
                console.log("TOOL_REQUEST", event);
                // TODO: call the tool for result.
                // enqueue.sendTo(
                //   ({ context }) =>
                //     context.inputSockets.tools["x-actor-ref"] as AnyActorRef,
                //   ({ context, event }) => ({
                //     type: "TOOL_REQUEST",
                //     params: event.params,
                //   }),
                // );
              }),
            },
            SET_VALUE: {
              actions: enqueueActions(({ enqueue, check }) => {
                enqueue("setValue");
              }),
            },
          },
          invoke: {
            src: "completeChat",
            input: ({ context }): CompleteChatInput => {
              console.log("CONTEXT", context);
              return {
                llm: context.inputs.llm! as
                  | OpenAIModelConfig
                  | OllamaModelConfig,
                system: context.inputs.system!,
                messages: context.inputs.messages?.map(({ id, ...rest }) => {
                  return rest;
                }) as OpenAIChatMessage[],
                tools: context.inputs.tools?.map((t) => {
                  return {
                    name: t.name,
                    description: t.description,
                    parameters: new UncheckedSchema(t.parameters),
                  };
                }),
              };
            },
            onDone: {
              actions: enqueueActions(({ enqueue, check, event }) => {
                console.log("EVENT", event);
                // We write the result whatever the result is.
                enqueue.assign({
                  outputs: ({ context, event }) => {
                    return {
                      ...context.outputs,
                      result: event.output.result,
                    };
                  },
                });

                if (
                  check(
                    ({ event }) =>
                      event.output.result.toolCalls &&
                      event.output.result.toolCalls.length > 0,
                  )
                ) {
                  enqueue.raise({
                    type: "TOOL_REQUEST",
                    params: event.output.result.toolCalls,
                  });

                  return;
                }
                // match(event)
                //   .with(
                //     {
                //       output: {
                //         result: {
                //           text: P.nullish,
                //           toolCalls: P.array(),
                //         },
                //       },
                //     },
                //     ({ output }) => {
                //       enqueue.sendTo(
                //         ({ context }) =>
                //           context.inputSockets.messages[
                //             "x-actor-ref"
                //           ] as AnyActorRef,
                //         ({ context, event }) => ({
                //           type: ThreadMachineEvents.addMessage,
                //           params: ChatMessage.assistant({
                //             ...output.result,
                //           }),
                //         }),
                //       );
                //     },
                //   )
                //   .run();

                if (
                  check(
                    ({ context }) =>
                      !isNil(context.inputSockets.messages["x-actor-ref"]),
                  )
                ) {
                  enqueue.sendTo(
                    ({ context }) =>
                      context.inputSockets.messages[
                        "x-actor-ref"
                      ] as AnyActorRef,
                    ({ context, event }) => ({
                      type: ThreadMachineEvents.addMessage,
                      params: ChatMessage.assistant(event.output.result),
                    }),
                  );
                }

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
        completed: {},
        requires_action: {
          entry: [
            enqueueActions(({ enqueue, event }) => {
              event.params.forEach((toolCall) => {
                enqueue.sendTo(
                  ({ context }) =>
                    context.inputSockets.tools["x-actor-ref"] as AnyActorRef,
                  ({ context, event }) => ({
                    type: "TOOL_REQUEST",
                    params: event.params,
                  }),
                );
              });
              console.log("REQUIRES ACTION", event);
            }),
          ],
          on: {
            TOOL_RESULT: {},
          },
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
  llm: OpenAIModelConfig | OllamaModelConfig;
  system: string;
  messages: Omit<Message, "id">[];
  tools: ToolDefinition<string, any>[];
};

const completeChatActor = fromPromise(
  async ({ input }: { input: CompleteChatInput }) => {
    console.log("INPUT", input);
    const result = await match(input)
      .with(
        {
          llm: {
            provider: "ollama",
          },
        },
        async ({ llm }) => {
          const model = ollama.ChatTextGenerator(llm);
          const res = await generateText(model, [
            ...(input.system
              ? [
                  {
                    role: "system",
                    content: input.system,
                  },
                ]
              : []),
            ...input.messages,
          ]);
          return { text: res };
        },
      )
      .with(
        {
          llm: {
            provider: "openai",
          },
          tools: P.array(),
        },
        async ({ llm, tools }) => {
          console.log("here", llm, tools);
          const model = openai.ChatTextGenerator({
            ...llm,
            api: new BaseUrlApiConfiguration(llm.apiConfiguration),
          });
          return await generateToolCallsOrText(model, tools, [
            ...(input.system
              ? [
                  {
                    role: "system",
                    content: input.system,
                  },
                ]
              : []),
            ...input.messages,
          ]);
        },
      )
      .with(
        {
          llm: {
            provider: "openai",
          },
        },
        async ({ llm }) => {
          const model = openai.ChatTextGenerator({
            ...llm,
            api: new BaseUrlApiConfiguration(llm.apiConfiguration),
          });
          const res = await generateText(model, [
            ...(input.system
              ? [
                  {
                    role: "system",
                    content: input.system,
                  },
                ]
              : []),
            ...(input.messages as any),
          ]);

          return {
            text: res,
          };
        },
      )
      .run();
    return {
      result,
    };
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
