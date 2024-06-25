import { createId } from "@paralleldrive/cuid2";
import type { ChatMessage } from "modelfusion";
import dedent from "ts-dedent";
import { SetOptional } from "type-fest";
import {
  assign,
  createMachine,
  enqueueActions,
  type PromiseActorLogic,
} from "xstate";

import { generateSocket } from "../controls/socket-generator";
import { DiContainer } from "../types";
import {
  BaseNode,
  NodeContextFactory,
  type BaseContextType,
  type BaseInputType,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "./base";

export enum ThreadActions {
  addMessage = "addMessage",
  addAndRunMessage = "addAndRunMessage",
}

const inputSockets = {
  // addMessage: generateSocket({
  //   name: "addMessage",
  //   type: "trigger",
  //   isMultiple: true,
  //   required: false,
  //   "x-key": "addMessage",
  //   "x-showSocket": true,
  //   "x-event": "ADD_MESSAGE",
  // }),
  messages: generateSocket({
    name: "messages",
    description: "Array of messages",
    "x-showSocket": true,
    "x-key": "messages",
    type: "array",
    "x-controller": "thread",
    isMultiple: false,
    default: [],
  }),
};
const outputSockets = {
  onRun: generateSocket({
    name: "onRun",
    type: "trigger",
    isMultiple: true,
    required: false,
    "x-key": "onRun",
    "x-showSocket": true,
    "x-event": "RUN",
  }),
  messages: generateSocket({
    name: "messages",
    type: "array",
    isMultiple: true,
    "x-key": "messages",
    "x-showSocket": true,
  }),
};

export const THREAD = "THREAD";

export enum ThreadMachineEvents {
  addMessage = `${THREAD}.ADD_MESSAGE`,
  addAndRunMessage = `${THREAD}.ADD_AND_RUN_MESSAGE`,
  clearThread = `${THREAD}.CLEAR_THREAD`,
  run = `${THREAD}.ON_RUN`,
}

export type ThreadMachineEvent =
  | {
      type: ThreadMachineEvents.addMessage;
      params: ChatMessage & { id?: string }; // Id is refers to callId if it's coming from llm.
    }
  | {
      type: ThreadMachineEvents.addAndRunMessage;
      params: ChatMessage & { id?: string }; // Id is refers to callId if it's coming from llm.
    }
  | {
      type: ThreadMachineEvents.clearThread;
    }
  | {
      type: ThreadMachineEvents.run;
    };

export const ThreadMachine = createMachine(
  {
    id: "thread",
    entry: enqueueActions(({ enqueue, context }) => {
      enqueue("initialize");
    }),
    context: (ctx) =>
      NodeContextFactory(ctx, {
        name: "Thread",
        description: "Thread of messages",
        inputSockets,
        outputSockets,
      }),

    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets> & {
        inputs: {
          messages: ChatMessage & { id: string }[];
        };
      };
      guards: None;
      context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
        inputs: {
          messages: ChatMessage & { id: string }[];
        };
      };
      actions: {
        type: "addMessage";
        params: ChatMessage;
      };
      events: ThreadMachineEvent;
      actors:
        | {
            src: "addMessage";
            logic: PromiseActorLogic<
              any,
              {
                threadId: string;
                params: any;
              }
            >;
          }
        | {
            src: "createThread";
            logic: PromiseActorLogic<NodeThread, void>;
          }
        | {
            src: "getThread";
            logic: PromiseActorLogic<
              any,
              {
                threadId: string;
              }
            >;
          };
    }>,
    initial: "idle",
    on: {
      INITIALIZE: {
        actions: ["initialize"],
      },
      SET_VALUE: {
        actions: ["setValue"],
      },
    },
    invoke: {
      src: "actorWatcher",
      input: ({ self }) => ({
        actor: self,
        stateSelectorPath: "context.inputs",
        event: "COMPUTE",
      }),
    },
    states: {
      idle: {
        on: {
          COMPUTE: {
            actions: enqueueActions(({ enqueue, self }) => {
              console.log("THREAD COMPUTE");
              const childId = `compute-${createId()}`;
              enqueue.assign({
                computes: ({ spawn, context, event }) => {
                  return {
                    ...context.computes,
                    [childId]: spawn("computeEvent", {
                      input: {
                        inputSockets: context.inputSockets,
                        inputs: {
                          ...event?.params?.inputs,
                        },
                        event: "RESULT",
                        parent: self,
                      },
                      systemId: childId,
                      id: childId,
                    }),
                  };
                },
              });
            }),
          },
          RESULT: {
            actions: enqueueActions(({ enqueue, context }) => {
              enqueue({
                type: "removeComputation",
              });
              enqueue.assign({
                outputs: ({ event }) => {
                  return {
                    messages: event.params.inputs?.messages,
                  };
                },
              });
              enqueue("resolveOutputSockets");
            }),
          },

          [ThreadMachineEvents.addMessage]: {
            actions: enqueueActions(({ enqueue, context, event }) => {
              enqueue({
                type: "addMessage",
                params: {
                  ...event.params,
                },
              });
              enqueue.raise({
                type: "COMPUTE",
              });
            }),
          },

          [ThreadMachineEvents.clearThread]: {
            actions: enqueueActions(({ enqueue, context }) => {
              const messagesSocketId = Object.keys(context.inputSockets).find(
                (k) => k.endsWith("messages"),
              );
              enqueue.sendTo(
                ({ system }) => system.get(messagesSocketId),
                ({ context }) => ({
                  type: "SET_VALUE",
                  params: {
                    value: [],
                  },
                }),
              );
              enqueue.raise({
                type: "COMPUTE",
              });
            }),
          },

          [ThreadMachineEvents.run]: {
            guard: {
              type: "hasConnection",
              params: {
                port: "output",
                key: "onRun",
              },
            },
            actions: enqueueActions(({ enqueue }) => {
              enqueue({
                type: "triggerSuccessors",
                params: {
                  port: "onRun",
                },
              });
            }),
          },
          [ThreadMachineEvents.addAndRunMessage]: {
            guard: {
              type: "hasConnection",
              params: {
                port: "output",
                key: "onRun",
              },
            },
            actions: enqueueActions(({ enqueue, event }) => {
              enqueue({
                type: "addMessage",
                params: {
                  ...event.params,
                },
              });
              enqueue.raise({
                type: "COMPUTE",
              });
              enqueue.raise(
                {
                  type: ThreadMachineEvents.run,
                },
                {
                  delay: 100,
                },
              );
            }),
            reenter: true,
          },
        },
      },
    },
  },
  {
    actions: {
      addMessage: enqueueActions(({ enqueue, context, event }) => {
        const id = event.params.id || `message_${createId()}`;
        enqueue.assign({
          inputs: ({ context }) => {
            return {
              ...context.inputs,
              messages: [
                ...(context.inputs?.messages || []),
                {
                  id,
                  ...event.params,
                },
              ],
            };
          },
        });

        const messagesSocketId = Object.keys(context.inputSockets).find((k) =>
          k.endsWith("messages"),
        );

        enqueue.sendTo(
          ({ system }) => system.get(messagesSocketId),
          ({ context }) => ({
            type: "SET_VALUE",
            params: {
              value: [...context.inputs.messages],
            },
          }),
        );
      }),
    },
  },
);

export type NodeThreadData = ParsedNode<"NodeThread", typeof ThreadMachine>;

export class NodeThread extends BaseNode<typeof ThreadMachine> {
  static nodeType = "Thread";
  static label = "Thread";
  static description = dedent`
  Used for keeping the messages.
  `;
  static icon = "mails";

  static parse(params: SetOptional<NodeThreadData, "type">): NodeThreadData {
    return {
      ...params,
      type: "NodeThread",
    };
  }

  static machines = {
    NodeThread: ThreadMachine,
  };

  constructor(di: DiContainer, data: NodeThreadData) {
    super("NodeThread", di, data, ThreadMachine, {});
  }
}
