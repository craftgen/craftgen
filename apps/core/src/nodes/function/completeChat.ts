import { createId } from "@paralleldrive/cuid2";
import { get, isNil, isNull, merge } from "lodash-es";
import {
  CoreAssistantMessage,
  CoreTool,
  CoreToolMessage,
  generateText,
  type ToolCallPart,
  type ToolResultPart,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
// import {
//   BaseUrlApiConfiguration,
//   ChatMessage,
//   generateText,
//   generateToolCalls,
//   ollama,
//   openai,
//   trimChatPrompt,
//   UncheckedSchema,
// } from "modelfusion";
// import type {
//   ToolCall,
//   ToolCallError,
//   ToolCallResult,
//   ToolDefinition,
// } from "modelfusion";
import dedent from "ts-dedent";
import { match, P } from "ts-pattern";
import type { OutputFrom, SnapshotFrom } from "xstate";
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
import { BaseNode, NodeContextFactory } from "../base";
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
import { getSocket } from "../../sockets";
import { outputSocketMachine } from "../../output-socket";
import { inputSocketMachine } from "../../input-socket";
import { slugify } from "../../lib/string";
import { turnJSONSchemaToZodSchema } from "../../lib/json-schema-to-zod";

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
    default: [],
    // "x-controller": "select",
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
  tools: generateSocket({
    "x-key": "tools",
    name: "Tools",
    title: "Tools",
    type: "trigger",
    description: dedent`
    The tools agent to use. 
    `,
    "x-event": "RUN",
    "x-showSocket": true,
    "x-isAdvanced": true,
    isMultiple: true,
    default: [],
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

// export type ToolCallInstance<NAME extends string, PARAMETERS, RETURN_TYPE> = {
//   tool: NAME;
//   toolCall: ToolCall<NAME, PARAMETERS>;
//   args: PARAMETERS;
// } & (
//   | {
//       ok: true;
//       result: RETURN_TYPE;
//     }
//   | {
//       ok: false;
//       result: ToolCallError;
//     }
//   | {
//       ok: null;
//       result: null;
//     }
// );

export type ToolResultObject = {
  toolCallId: string;
  toolName: string;
  args: any;
} & (
  | {
      ok: true;
      result: any;
    }
  | {
      ok: false;
      result: Error;
    }
  | {
      ok: null;
      result: null;
    }
);

const standardizeMessage = (message: OutputFrom<typeof completeChatActor>) => {
  return match(message)
    .with(
      {
        text: P.string,
      },
      (m) => {
        return {
          role: "assistant",
          content: m.text,
        };
      },
    )
    .run();
};

export type OpenAICompleteChatData = ParsedNode<
  "NodeCompleteChat",
  typeof CompleteChatMachine
>;

interface CompleteChatInput {
  llm: OpenAIModelConfig | OllamaModelConfig;
  system: string;
  messages: Omit<Message, "id">[];
  tools: CoreTool;
  toolCalls: Record<string, ToolResultObject>;
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
      // .with(
      //   {
      //     llm: {
      //       provider: "ollama",
      //     },
      //   },
      //   async ({ llm }) => {
      //     const model = ollama.ChatTextGenerator({
      //       ...llm,
      //     });

      //     const res = await generateText({
      //       model,
      //       prompt: [
      //         ...(input.system
      //           ? [
      //               {
      //                 role: "system" as const,
      //                 content: input.system,
      //               },
      //             ]
      //           : []),
      //         ...(simplyfyMessages(input.messages) as OllamaChatMessage[]),
      //       ],
      //       fullResponse: true,
      //     });
      //     return res;
      //   },
      // )
      // .with(
      //   {
      //     llm: {
      //       provider: "openai",
      //     },
      //     tools: P.when((t) => Object.keys(t).length > 0),
      //     toolCalls: P.when((t) => Object.keys(t).length === 0),
      //   },
      //   async ({ llm, tools, toolCalls }) => {
      //     console.log("REQUESTING tool call from the API.");
      //     const model = openai
      //       .ChatTextGenerator({
      //         ...llm,
      //         api: new BaseUrlApiConfiguration(llm.apiConfiguration),
      //       })
      //       .withChatPrompt();

      //     const chat: ChatPrompt = {
      //       system: input.system,
      //       messages: input.messages as ChatMessage[],
      //     };

      //     const res = await generateToolCalls({
      //       model,
      //       tools,
      //       prompt: await trimChatPrompt({
      //         model: model,
      //         prompt: chat,
      //       }),
      //       fullResponse: true,
      //     });
      //     return res;
      //   },
      // )
      .with(
        {
          llm: {
            provider: "openai",
          },
          tools: P.when((t) => Object.keys(t).length > 0),
          toolCalls: P.when((t) => Object.keys(t).length > 0),
        },
        async ({ llm, toolCalls }) => {
          const openai = createOpenAI({
            // custom settings
            baseURL: input.llm.apiConfiguration.baseUrl,
            apiKey: input.llm.apiConfiguration.APIKey,
          }).chat(input.llm.model, {
            logitBias: {
              "50256": -100, //  to prevent the <|endoftext|> token from being generated.
            },
          });

          const tools = Object.entries(input.tools).reduce((acc, [key, t]) => {
            acc[key] = {
              ...t,
              parameters: turnJSONSchemaToZodSchema(t.parameters), // TODO: temp fix
            };
            return acc;
          }, {});
          console.log("PASSING THE TOOL CALL RESULTS TO API.");
          const toolCallResponses = [];
          if (Object.keys(toolCalls).length > 0) {
            toolCallResponses.push({
              role: "assistant",
              content: [
                ...Object.values(toolCalls).map(
                  (t) =>
                    ({
                      type: "tool-call",
                      toolName: t.toolName,
                      toolCallId: t.toolCallId,
                      args: t.args,
                    }) as ToolCallPart,
                ),
              ],
            } as CoreAssistantMessage);
            toolCallResponses.push({
              role: "tool",
              content: [
                ...Object.values(toolCalls).map(
                  (t) =>
                    ({
                      type: "tool-result",
                      toolCallId: t.toolCallId,
                      toolName: t.toolName,
                      result: t.result,
                      ok: t.ok,
                      isError: t.ok === false,
                    }) as ToolResultPart,
                ),
              ],
            } as CoreToolMessage);
          }
          console.log("INPUT TOOL RESPONSES", {
            ...input.llm,
            model: openai,
            tools: tools,
            system: input.system,
            messages: input.messages.concat(toolCallResponses),
          });
          const res = await generateText({
            ...input.llm,
            model: openai,
            tools: tools,
            system: input.system,
            messages: input.messages.concat(toolCallResponses),
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
          const openai = createOpenAI({
            // custom settings
            baseURL: input.llm.apiConfiguration.baseUrl,
            apiKey: input.llm.apiConfiguration.APIKey,
          }).chat(input.llm.model, {
            logitBias: {
              "50256": -100, //  to prevent the <|endoftext|> token from being generated.
            },
          });

          const tools = Object.entries(input.tools).reduce((acc, [key, t]) => {
            acc[key] = {
              ...t,
              parameters: turnJSONSchemaToZodSchema(t.parameters), // TODO: temp fix
            };
            return acc;
          }, {});

          console.log("INPUT", {
            ...input.llm,
            model: openai,
            system: input.system,
            messages: input.messages,
            tools,
          });

          const res = await generateText({
            ...input.llm,
            model: openai,
            tools: tools,
            system: input.system,
            messages: input.messages,
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
            def: CoreTool;
          }
        >;
        toolCalls: Record<string, ToolResultObject>;
      };
      outputs: {
        result: string;
      };
      parent: {
        id: string;
      };
    },
    events: {} as
      | {
          type: "TOOL_REQUEST";
          params: ToolCallPart[];
        }
      | {
          type: "TOOL_RESULT";
          params: {
            id: string;
            res: ToolResultPart;
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
            tools: Object.entries(context.inputs.tools).reduce(
              (acc, [key, t]) => {
                acc[key] = t.def;
                return acc;
              },
              {},
            ),
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
                  toolCalls: P.when((t) => t && t.length > 0),
                },
                (res) => {
                  enqueue.raise({
                    type: "TOOL_REQUEST",
                    params: res.toolCalls,
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
            acc[toolCall.toolCallId] = {
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              args: toolCall.args,
              result: null,
              ok: null,
            };
            return acc;
          },
          {} as Record<string, ToolResultObject>,
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
          const { toolName, args } = toolCall;
          // const eventType = name.split("-")[1];
          const tool = context.inputs.tools[toolName];

          console.log({
            tool: tool,
            actorRef: tool?.actorRef,
            params: {
              type: "TRIGGER",
              params: {
                executionNodeId: toolCall.toolCallId,
                inputs: {
                  ...args,
                },
              },
            },
          });

          enqueue.sendTo(
            ({ context }) => context.inputs.tools[toolName].actorRef,
            ({ self }) => ({
              type: "TRIGGER",
              params: {
                senders: [
                  {
                    id: self.id,
                  },
                ],
                callId: toolCall.toolCallId,
                inputs: {
                  ...args,
                },
              },
            }),
          );
        }
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
        RESULT: {
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
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "Complete Chat",
      description: "Creates response to a chat message using the model",
      inputSockets,
      outputSockets,
    }),
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
    actions: {
      type: "adjustMaxCompletionTokens";
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
        RESULT: {
          actions: enqueueActions(({ enqueue, event, check, context }) => {
            console.log("RESULT @@", event);
            enqueue.assign({
              outputs: ({ context, event }) => ({
                ...context.outputs,
                result: event.params?.res.result,
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
                ({ context }) =>
                  getSocket({
                    key: "messages",
                    sockets: context.inputSockets,
                  }),
                ({ event }) => ({
                  type: `FORWARD.${ThreadMachineEvents.addMessage}`,
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
          guard: ({ context, event }) => {
            return true;
            // return (
            //   (context.inputs.messages || []).length > 0 ||
            //   !isNil(event.params?.values)
            // );
          },
          actions: enqueueActions(
            ({ enqueue, check, event, context, system }) => {
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
              const runId = `call-${createId()}`;

              const toolsSocket = getSocket({
                sockets: context.outputSockets,
                key: "tools",
              }).getSnapshot() as SnapshotFrom<typeof outputSocketMachine>;

              const tools = Object.keys(
                get(toolsSocket, ["context", "definition", "x-connection"], {}),
              )
                .map((targetTriggerSocketKey: string) => {
                  const targetTrigger = system.get(targetTriggerSocketKey);
                  const socketDefinition =
                    targetTrigger.getSnapshot() as SnapshotFrom<
                      typeof inputSocketMachine
                    >;
                  const parentActor = system
                    .get(socketDefinition.context.parent.id)
                    .getSnapshot();

                  return {
                    actorRef: targetTrigger,
                    def: {
                      name: parentActor.context.name,
                      description: parentActor.context.description,
                      parameters: socketDefinition.context.definition.schema,
                    },
                  };
                })
                .reduce((acc, { actorRef, def }) => {
                  acc[slugify(def.name, "_")] = {
                    actorRef,
                    def,
                  };
                  return acc;
                }, {});

              enqueue.sendTo(
                ({ system }) => system.get("editor"),
                ({ self, context }) => ({
                  type: "SPAWN_RUN",
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
                        ...event.params.inputs,
                        tools,
                        // llm: context.inputs.llm! as
                        //   | OpenAIModelConfig
                        //   | OllamaModelConfig,
                        // system: context.inputs.system!,
                        // messages: context.inputs.messages?.map(
                        //   ({ id, ...rest }) => {
                        //     return rest;
                        //   },
                        // ) as OpenAIChatMessage[],
                        // tools: Object.entries(context.inputs.tools)
                        //   .map(([key, t]) => {
                        //     const { nodeID } = extractGroupsFromToolName(key);
                        //     const actorRef = get(context.inputSockets.tools, [
                        //       "x-connection",
                        //       nodeID,
                        //       "actorRef",
                        //     ]) as AnyActorRef;
                        //     console.log("ACTOR REF", actorRef);
                        //     return {
                        //       key,
                        //       actorRef,
                        //       def: {
                        //         name: t.name,
                        //         description: t.description,
                        //         parameters: new UncheckedSchema(t.parameters),
                        //       },
                        //     };
                        //   })
                        //   .reduce((acc, { key, ...rest }) => {
                        //     acc[key] = rest;
                        //     return acc;
                        //   }, {}),
                      },
                    },
                  },
                }),
              );
            },
          ),
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
  }
}
