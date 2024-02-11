import { createId } from "@paralleldrive/cuid2";
import { get, isNil, merge } from "lodash-es";
import {
  BaseUrlApiConfiguration,
  ChatMessage,
  generateText,
  generateToolCalls,
  ollama,
  openai,
  trimChatPrompt,
  UncheckedSchema,
} from "modelfusion";
import type {
  OllamaChatMessage,
  OllamaChatPrompt,
  OpenAIChatMessage,
  ToolCall,
  ToolCallError,
  ToolCallResult,
  ToolDefinition,
} from "modelfusion";
import dedent from "ts-dedent";
import { match, P } from "ts-pattern";
import type { OutputFrom } from "xstate";
import {
  assertEvent,
  assign,
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
} from "xstate";
import type { AnyActorRef } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { Message } from "../../controls/thread.control";
import type { DiContainer } from "../../types";
import { BaseNode } from "../base";
import type {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  None,
  ParsedNode,
} from "../base";
import type { OllamaModelConfig } from "../ollama/ollama";
import { ThreadMachineEvents } from "../thread";
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
    "x-controller": "textarea",
    title: "System Message",
    "x-showSocket": true,
    "x-key": "system",
  }),
  append: generateSocket({
    "x-key": "append",
    name: "Append",
    title: "Append",
    type: "boolean",
    description: dedent`
    Append the result to the thread. 
    `,
    "x-showSocket": false,
    isMultiple: false,
    default: true,
  }),
  messages: generateSocket({
    name: "Messages",
    description: "Thread of messages",
    "x-showSocket": true,
    "x-key": "messages",
    type: "array",
    allOf: [
      {
        enum: ["NodeThread"],
        type: "string" as const,
      },
    ],
    "x-controller": "select",
    "x-actor-type": "NodeThread",
    "x-actor-config": {
      NodeThread: {
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
    default: [],
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
  text: generateSocket({
    name: "text" as const,
    type: "string" as const,
    description: "Result of the generation",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "text",
  }),
  result: generateSocket({
    name: "result" as const,
    type: "object" as const,
    description: "Result of the generation (JSON)",
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

const standardizeMessage = (message: OutputFrom<typeof completeChatActor>) =>
  match(message)
    .with(
      {
        value: {
          text: P.string,
        },
      },
      (m) => {
        return ChatMessage.assistant({
          text: m.value.text,
          toolResults: null,
        });
      },
    )
    .with(
      {
        text: P.string,
      },
      (m) => {
        return ChatMessage.assistant({
          text: m.text,
          toolResults: null,
        });
      },
    )
    .run();

export type OpenAICompleteChatData = ParsedNode<
  "NodeCompleteChat",
  typeof CompleteChatMachine
>;

interface CompleteChatInput {
  llm: OpenAIModelConfig | OllamaModelConfig;
  system: string;
  messages: Omit<Message, "id">[];
  tools: ToolDefinition<string, any>[];
  toolCalls: Record<string, ToolCallInstance<string, any, any>>;
}

const simplyfyMessages = (messages: CompleteChatInput["messages"]) =>
  messages.map((message) =>
    match(message)
      .with({ content: P.string }, (m) => {
        return {
          ...m,
          content: m.content,
        };
      })
      .with(
        {
          content: P.array({
            type: "text",
            text: P.string,
          }),
        },
        (m) => {
          return {
            ...m,
            content: m.content.map((c) => c.text).join(" "),
          };
        },
      )
      .run(),
  );

// And then use it:
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
          const model = ollama.ChatTextGenerator({
            ...llm,
          });
          const res = await generateText({
            model,
            prompt: [
              ...(input.system
                ? [
                    {
                      role: "system" as const,
                      content: input.system,
                    },
                  ]
                : []),
              ...(simplyfyMessages(input.messages) as OllamaChatMessage[]),
            ],
            fullResponse: true,
          });
          return res;
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

          const res = await generateToolCalls({
            model,
            tools,
            prompt: [
              ...(input.system
                ? [
                    {
                      role: "system",
                      content: input.system,
                    },
                  ]
                : []),
              ...input.messages,
            ],
            fullResponse: true,
          });
          return res;
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

          const res = await generateToolCalls({
            model,
            tools,
            prompt: [
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
            ],
            fullResponse: true,
          });
          return res;
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
          const res = await generateText({
            model,
            promp: await trimChatPrompt({
              model,
              prompt: [
                ...(input.system
                  ? [
                      {
                        role: "system",
                        content: input.system,
                      },
                    ]
                  : []),
                ...(input.messages as any),
              ],
            }),
            fullResponse: true,
          });

          return res;
        },
      )
      .run();

    console.log("RESULT", result);
    return result;
  },
);

function extractGroupsFromToolName(inputString: string) {
  const regex = /^(.+?)_.+-(.+)$/;
  const matches = inputString.match(regex);

  if (matches && matches.length === 3) {
    // The first element in 'matches' is the entire match, followed by the two captured groups.
    return {
      nodeID: `node_${matches[1]}`,
      event: matches[2],
    };
  } else {
    throw new Error("Pattern not found in the string");
  }
}

const completeChatMachineRun = setup({
  types: {
    input: {} as {
      inputs: {
        llm: OpenAIModelConfig | OllamaModelConfig;
        system: string;
        messages: Omit<Message, "id">[];
        tools: Record<
          string,
          {
            actorRef: AnyActorRef;
            def: ToolDefinition<string, any>[];
          }
        >;
      };
      senders: {
        id: string;
      }[];
      parent: {
        id: string;
      };
    },
    context: {} as {
      senders: {
        id: string;
      }[];
      inputs: {
        llm: OpenAIModelConfig | OllamaModelConfig;
        system: string;
        messages: Omit<Message, "id">[];
        tools: Record<
          string,
          {
            actorRef: AnyActorRef;
            def: ToolDefinition<string, any>[];
          }
        >;
        toolCalls: Record<string, ToolCallInstance<string, any, any>>;
      };
      outputs: {
        result: string | ChatMessage;
      };
      parent: {
        id: string;
      };
    },
    events: {} as
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
        },
  },
  actors: {
    completeChat: completeChatActor,
  },
}).createMachine({
  id: "completeChat",
  context: ({ input }) => {
    return merge(
      {
        inputs: {
          toolCalls: {},
        },
        outputs: {},
      },
      input,
    );
  },

  initial: "in_progress",
  states: {
    in_progress: {
      on: {
        TOOL_REQUEST: {
          target: "requires_action",
        },
        COMPLETE: {
          target: "complete",
        },
      },
      invoke: {
        src: "completeChat",
        input: ({ context }) => {
          console.log("INVOKE CONTEXT", context.inputs);
          return {
            ...context.inputs,
            tools: Object.values(context.inputs.tools).map((t) => {
              return t.def;
            }),
          };
        },
        onDone: {
          actions: enqueueActions(({ enqueue, check, event, self }) => {
            console.log("EVENT", event);
            enqueue.assign({
              outputs: ({ context, event }) => {
                return {
                  ...context.outputs,
                  result: event.output,
                  ok: true,
                };
              },
            });
            match(event.output)
              .with(
                {
                  value: {
                    toolCalls: P.when((t) => t && t.length > 0),
                  },
                },
                (res) => {
                  enqueue.raise({
                    type: "TOOL_REQUEST",
                    params: res.value.toolCalls,
                  });
                },
              )
              .otherwise((res) => {
                enqueue.raise({
                  type: "COMPLETE",
                });
              });
          }),
        },
        onError: {
          target: "error",
          actions: enqueueActions(({ enqueue, event }) => {
            console.log("ERROR", event);
            enqueue.raise({
              type: "COMPLETE",
            });
          }),
        },
      },
    },
    requires_action: {
      entry: enqueueActions(({ enqueue, event, context }) => {
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
          inputs: ({ context }) => {
            return {
              ...context.inputs,
              toolCalls,
            };
          },
        });
        for (const toolCall of event.params) {
          const { name, args } = toolCall;
          const eventType = name.split("-")[1];
          const tool = context.inputs.tools[name];

          console.log({
            tool: tool,
            actorRef: tool?.actorRef,
            params: {
              type: eventType,
              params: {
                executionNodeId: toolCall.id,
                values: {
                  ...args,
                },
              },
            },
          });

          enqueue.sendTo(
            ({ context }) => context.inputs.tools[name].actorRef,
            ({ self }) => ({
              type: eventType,
              params: {
                senders: [
                  {
                    id: self.id,
                  },
                ],
                executionNodeId: toolCall.id,
                values: {
                  ...args,
                },
              },
            }),
          );
        }
        console.log("REQUIRES ACTION", event);
      }),
      always: [
        {
          guard: (
            { context }, // WHEN ALL TOOL CALLS HAVE BEEN COMPLETED, WE CAN CONTINUE.
          ) =>
            Object.values(context.inputs.toolCalls).every(
              (t) => !isNil(t.result),
            ),
          target: "in_progress",
        },
      ],
      on: {
        TOOL_RESULT: {
          // HANDLE RESPONSES FROM TOOLS.
          actions: enqueueActions(({ enqueue, event, context }) => {
            console.log("GOT TOOL RESULT", { event });
            enqueue.assign({
              inputs: ({ context }) => {
                return {
                  ...context.inputs,
                  toolCalls: {
                    ...context.inputs.toolCalls,
                    [event.params.id]: {
                      ...context.inputs.toolCalls[event.params.id],
                      ...event.params.res,
                    },
                  },
                };
              },
            });
          }),
        },
      },
    },
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
      entry: enqueueActions(({ enqueue, context, event, system }) => {
        console.log("COMPLETE", context, event);
        for (const sender of context.senders) {
          enqueue.sendTo(system.get(sender.id), ({ context, self }) => ({
            type: "RESULT",
            params: {
              id: self.id,
              res: context.outputs,
            },
          }));
        }
      }),
    },
    error: {
      on: {
        RETRY: {
          target: "in_progress",
        },
      },
      output: ({ context }) => {
        return {
          ...context.outputs,
          error: true,
        };
      },
    },
  },
  output: ({ context }) => context.outputs,
});

const CompleteChatMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QGMD2BbADgGzAFzAFpkALAQzwGIBBAZVoEkBxAOQH0BhACQYBkARANoAGALqJQmVLACWeGagB2EkAA9EAFgCsATgB0AJgCMANgAcAZjM6tw4UYDsFgDQgAnpoNa9wk16NmRsI6QRomGgC+Ea5oWLgExORUDCwMACoM1LwMAFoAoiLiSCBSsvJKKuoIFgb62g4OwoFaGtq6Lu6IRgYWhgYGdhoOGsIjJjoWUTEYOPhEpBSUtHlpbABqWQCqBWIqpXIKysVV43oORka6TY0WLS2uHgjdUyCxswkLeHoyELiUmwAFfjUNJ5Ni0ADyHAA0itCntpAcKsdNA4HogHCZerVhBYTAEtAMzGYTC83vF5klvr8wJQAEp5WibXhpeHFfblI6gKpmAxnHQaAwOWyCwnmDqPEzmHyXPwWIbWLRaMkzCmJCjUv4M5as3bsxGcyqIFp6bStWo6JwaeUhdEILQOPnDJpmLRBLS8y4quJzdVfH5azYsNmSA2HI0IPx6GpmByBMwaIyJrQ1O1DBymqVJkxOAzmOOTF6KVAQOAqcm+z4IsrhlEIQhGO0GBN6XmCy4XAV2Mze96UjUBsDVpFctSIS16HQGVq8sxNFOOnR2km9LQmN12fqE-qF6Y+j5UisEYeGutx-n58JzuwXAx2qd84QtcwjOO2LG9tWfPRgABOv9QX8T1rblx28G8LF8ElhEaHRfDTAJJ0xNdmwcLsrEiKIIiAA */
  id: "complete-chat",
  entry: enqueueActions(({ enqueue }) => {
    enqueue("initialize");
  }),
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
          RUN: undefined,
          system: "",
          messages: [],
          llm: null,
          tools: {},
          ...defaultInputs,
        },
        runs: {},
        outputs: {
          onDone: undefined,
          result: {},
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
    );
  },
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
          type: "RESULT";
          params: {
            id: string;
            res: {
              result: OutputFrom<typeof completeChatActor>;
              ok: boolean;
            };
          };
        };
    guards: None;
    actors: None;
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        RESULT: {
          actions: enqueueActions(({ enqueue, event, check }) => {
            console.log("RESULT @@", event);
            enqueue.assign({
              outputs: ({ context, event }) => ({
                ...context.outputs,
                result: event.params?.res,
                messages: [
                  ...context.inputs.messages!,
                  {
                    id: event.params.id,
                    ...standardizeMessage(event.params.res.result),
                  },
                ],
                text: event.params?.res.result.text,
              }),
            });
            if (check(({ context }) => !!context.inputs.append)) {
              enqueue.sendTo(
                ({ context }) => context.inputSockets.messages["x-actor-ref"],
                ({ context, event }) => ({
                  type: ThreadMachineEvents.addMessage,
                  params: {
                    id: event.params.id,
                    ...standardizeMessage(event.params.res.result),
                  },
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
          guard: ({ context, event }) => {
            return (
              (context.inputs.messages || []).length > 0 ||
              !isNil(event.params?.values)
            );
          },
          actions: enqueueActions(({ enqueue, check, event }) => {
            if (check(({ event }) => !isNil(event.params?.values))) {
              enqueue({
                type: "setValue",
                params: {
                  values: event.params?.values!,
                },
              });
            }
            const runId = `call-${createId()}`;
            enqueue.sendTo(
              ({ system }) => system.get("editor"),
              ({ self, context }) => ({
                type: "SPAWN",
                params: {
                  id: runId,
                  parentId: self.id,
                  machineId: "NodeCompleteChat.run",
                  systemId: runId,
                  input: {
                    senders: [{ id: self.id }],
                    parent: {
                      id: self.id,
                    },
                    inputs: {
                      llm: context.inputs.llm! as
                        | OpenAIModelConfig
                        | OllamaModelConfig,
                      system: context.inputs.system!,
                      messages: context.inputs.messages?.map(
                        ({ id, ...rest }) => {
                          return rest;
                        },
                      ) as OpenAIChatMessage[],
                      tools: Object.entries(context.inputs.tools)
                        .map(([key, t]) => {
                          const { nodeID } = extractGroupsFromToolName(key);
                          const actorRef = get(context.inputSockets.tools, [
                            "x-connection",
                            nodeID,
                            "actorRef",
                          ]) as AnyActorRef;
                          console.log("ACTOR REF", actorRef);
                          return {
                            key,
                            actorRef,
                            def: {
                              name: t.name,
                              description: t.description,
                              parameters: new UncheckedSchema(t.parameters),
                            },
                          };
                        })
                        .reduce((acc, { key, ...rest }) => {
                          acc[key] = rest;
                          return acc;
                        }, {}),
                    },
                  },
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

export class NodeCompleteChat extends BaseNode<typeof CompleteChatMachine> {
  static nodeType = "CompleteChat";
  static label = "Complete Chat";
  static description = dedent`
    Use LLMs to complete a chat. 
  `;
  static icon = "message-square-text";

  static section = "Functions";

  static machines = {
    NodeCompleteChat: CompleteChatMachine,
    "NodeCompleteChat.run": completeChatMachineRun,
  };

  constructor(di: DiContainer, data: OpenAICompleteChatData) {
    super("NodeCompleteChat", di, data, CompleteChatMachine, {});
    this.extendMachine({
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
    this.setup();
  }
}
