import { isNil, merge } from "lodash-es";
import {
  BaseUrlApiConfiguration,
  chat,
  ChatMessage,
  generateText,
  generateToolCalls,
  ollama,
  openai,
  OpenAIApiConfiguration,
  OpenAIChatMessage,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
  ToolCall,
  ToolCallError,
  ToolCallResult,
  ToolDefinition,
  UncheckedSchema,
} from "modelfusion";
import dedent from "ts-dedent";
import { match, P } from "ts-pattern";
import {
  AnyActorRef,
  assertEvent,
  assign,
  createMachine,
  enqueueActions,
  fromPromise,
} from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { Message } from "../../controls/thread.control";
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
import { ThreadMachine, ThreadMachineEvents } from "../thread";
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

export type ToolCallInstance<NAME extends string, PARAMETERS, RETURN_TYPE> = {
  tool: NAME;
  toolCall: ToolCall<NAME, PARAMETERS>;
  args: PARAMETERS;
} & (
  | {
      ok: true;
      result: RETURN_TYPE;
    }
  | {
      ok: false;
      result: ToolCallError;
    }
  | {
      ok: null;
      result: null;
    }
);

const OpenAICompleteChatMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWgGNkBbVAGzABcxCALLSgOhwgoGIBVABQBEBBACoBRAPoBlAPIBhANJCBAbQAMAXUShUyWDko5kGdSAAeiAJwB2RqdMA2JaYCMD0wBYlADgcBmLwBoQAJ6ILg4ArIyhDuahXnYuAEw2FqYAvin+aJi4hCTkVDQE9Ews7ABKHAByympIIJrauvqGJgjx5qYRSl0OSuZeoaZeLqb+QQih8V6M5kqh7kn27jOmoWkZ6Nj4RKQU1HQMzKxgnLyColIAEgCSADI8InxSAhKlYtWG9Tp6BrUt5vGMLpA4HAhyjRBeeJKRjxBKeJRDdymdwhNYgTKbHI7fL7YpHNhieQiABqfBuHCE71qn0aP1ALQcUOmvRs7ncoVC-yS83BrVhVlZSnipjaNn+jPMaIx2W2eT2hQOACcAK4YDA4DBQZgYESoRXIKCKuCwNgQfRgbUAN2QAGsLdKtrldgUiowVWqNVqNbr9YbjQgNdaCAxvtUqRotF8mr9gvEAaEXKz2UMYimXLzEwCESjzGK2gjJlKNjKnTiFUx3erNdqfQajbATWBFfrFYxyAwAGbIRXERgOrFyl1K1VVr06vV1-2B5DB2lh1QfSO05qIHqTRjOdpeVwOGwTNm87fuKyeNnbkLzdpFrKO7Hy12Vz01id+htsZ4SG4iUpCACKFLERQF2pJdvhXBAbBCRhIOcGxNyGcwXHcXkbC8Y9HATBwlkiRklBsa9MVlZ1cTdEcn29F96xNQkBBJMkKXDOpQOjelghcSwbHiKJOPiJZcy8MFAghGwbGmVCklCPd2KSFwXAIks7yHCsyOrCjfSotgpAkABZLgbnkSlgIjBowJjCCoJg2x4PYpDeTaSwE1QpDzHFXNEnk29BxIx9qyI-IIDYIxYEoBgLSwDtqEVAAKHoAEo2H7Pz72HD1fNLagIEYmlTNYhBnCmRlPBEiw+KSXlCo3CZYlMJQkIcJDZg8gdiPLUjUq1I0AEdlRwesRCwAhaXfCRP2-IQxA4G4gJqYyozpYxEHcflYTg2FYVsLxzF5BNoTg+YsMgjkYlSdJ0WLTyWofFSOrAbrergfrBu+NgsuY+a-jaE8VnFSJeiw7aRUBRw4z6ETzEZeI0lOjBkAgOBDES9KlMXEyWIWhA8BsXlMcBEE8aUeqmqSpTDgoFG5vApx0KhTlHEKoZ-qE8YwmmEUoVQzl5nc07EcU7zrvJ5czNiXb9tsOMhkTWJypEqxczguYnB6DlJR587mrLK72ufdTjUFnL0bcY9WTg8XJlk8TtoGRgBKw5EwZZOS1ZvDXkuU7XiYgfW0ZaJapkhJDUPcWJnBcUI7ITGFrE5doRWcp31hd4n+e1rqer6gahdmrP0aWgFt3BzahjQ4Pw6ZyDoSRSE2VsP6liJpGSOJ733tjGXRPYlEeNZCHg4bvnWqbFsW-AzleQsSwuLjLD2REpYHChlIgA */
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
          tools: {},
        },
        toolCalls: {},
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
    input: BaseInputType<typeof inputSockets, typeof outputSockets> & {
      toolCalls: Record<string, ToolCallInstance<string, any, any>>;
    };
    context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
      toolCalls: Record<string, ToolCallInstance<string, any, any>>;
    };
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
          params: ToolCall<string, any>[];
        }
      | {
          type: "TOOL_RESULT";
          params: {
            id: string;
            res: ToolCallResult<string, any, any>;
          };
        }
      | {
          type: "COMPLETE";
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
      on: {
        SET_VALUE: {
          actions: enqueueActions(({ enqueue, check }) => {
            enqueue("setValue");
          }),
        },
      },
      states: {
        in_progress: {
          on: {
            TOOL_REQUEST: {
              target: "requires_action",
              actions: enqueueActions(({ enqueue, check, event }) => {
                console.log("TOOL_REQUEST", event);
              }),
            },
            COMPLETE: {
              target: "#openai-complete-chat.running.completed",
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
                tools: Object.values(
                  context.inputs.tools as Record<string, Tool>,
                ).map((t) => {
                  return {
                    name: t.name,
                    description: t.description,
                    parameters: new UncheckedSchema(t.parameters),
                  };
                }),
                toolCalls: context.toolCalls,
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
                } else {
                  enqueue.assign({
                    toolCalls: {},
                  });
                }

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
                enqueue.raise({
                  type: "COMPLETE",
                });
              }),
            },
            onError: {
              target: "#openai-complete-chat.error",
              actions: ["setError"],
            },
          },
        },
        completed: {
          after: {
            1000: "#openai-complete-chat.idle",
          },
          entry: enqueueActions(({ enqueue }) => {
            enqueue({
              type: "triggerSuccessors",
              params: {
                port: "onDone",
              },
            });
          }),
        },
        requires_action: {
          entry: [
            enqueueActions(({ enqueue, event, context }) => {
              console.log({
                TOOOLS: context.inputSockets.tools["x-connection"],
              });
              assertEvent(event, "TOOL_REQUEST");

              const toolCalls = event.params.reduce(
                (acc, toolCall) => {
                  acc[toolCall.id] = {
                    tool: toolCall.name,
                    args: toolCall.args,
                    result: null,
                    ok: null,
                    toolCall,
                  };
                  return acc;
                },
                {} as Record<string, ToolCallInstance<string, any, any>>,
              );
              enqueue.assign({
                toolCalls,
              });
              for (const toolCall of event.params) {
                const { name, args } = toolCall;
                const nodeId = Object.keys(
                  context.inputSockets.tools["x-connection"],
                )[0];
                console.log("NODE ID", nodeId);
                const eventType = name.split("-")[1];
                enqueue({
                  type: "triggerNode",
                  params: {
                    nodeId,
                    event: {
                      type: eventType,
                      params: {
                        executionNodeId: toolCall.id,
                        values: {
                          ...args,
                        },
                      },
                    },
                  },
                });
              }
              console.log("REQUIRES ACTION", event);
            }),
          ],
          always: [
            {
              guard: (
                { context }, // WHEN ALL TOOL CALLS HAVE BEEN COMPLETED, WE CAN CONTINUE.
              ) => Object.values(context.toolCalls).every((t) => t.result),
              target: "in_progress",
            },
          ],
          on: {
            TOOL_RESULT: {
              // HANDLE RESPONSES FROM TOOLS.
              actions: enqueueActions(({ enqueue, event, context }) => {
                console.log("GOT TOOL RESULT", { event });
                enqueue.assign({
                  toolCalls: ({ context }) => {
                    return {
                      ...context.toolCalls,
                      [event.params.id]: {
                        ...context.toolCalls[event.params.id],
                        ...event.params.res,
                      },
                    };
                  },
                });
              }),
            },
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
  toolCalls: Record<string, ToolCallInstance<string, any, any>>;
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
          tools: P.when((t) => Object.keys(t).length > 0),
          toolCalls: P.when((t) => Object.keys(t).length === 0),
        },
        async ({ llm, tools, toolCalls }) => {
          console.log("REQUESTING tool call from the API.");
          const model = openai.ChatTextGenerator({
            ...llm,
            api: new BaseUrlApiConfiguration(llm.apiConfiguration),
          });

          return await generateToolCalls(model, tools, [
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
          tools: P.when((t) => Object.keys(t).length > 0),
          toolCalls: P.when((t) => Object.keys(t).length > 0),
        },
        async ({ llm, tools, toolCalls }) => {
          console.log("PASSING THE TOOL CALL RESULTS TO API.");
          const model = openai.ChatTextGenerator({
            ...llm,
            api: new BaseUrlApiConfiguration(llm.apiConfiguration),
          });

          const toolCallResponses: OpenAIChatMessage[] = [];

          if (Object.keys(toolCalls).length > 0) {
            toolCallResponses.push(
              openai.ChatMessage.assistant(null, {
                toolCalls: Object.values(toolCalls).map((t) => t.toolCall),
              }),
            );
            Object.values(toolCalls).forEach((toolCall) => {
              toolCallResponses.push(
                openai.ChatMessage.tool({
                  toolCallId: toolCall.toolCall.id,
                  content: toolCall.result,
                }),
              );
            });
          }

          return await generateToolCalls(model, tools, [
            ...(input.system
              ? [
                  {
                    role: "system",
                    content: input.system,
                  },
                ]
              : []),
            ...input.messages,
            ...toolCallResponses,
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
  static nodeType = "CompleteChat";
  static label = "Complete Chat";
  static description = dedent`
    Use LLMs to complete a chat. 
  `;
  static icon = "message-square-text";

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
