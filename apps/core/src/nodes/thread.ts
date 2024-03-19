import { createId } from "@paralleldrive/cuid2";
import type { ChatMessage } from "modelfusion";
import type { MessageCreateParams } from "openai/resources/beta/threads/messages/messages.mjs";
import type { PromiseActorLogic } from "xstate";
import { assign, createMachine, enqueueActions } from "xstate";
import dedent from "ts-dedent";

import { generateSocket } from "../controls/socket-generator";
import type {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  None,
  ParsedNode,
} from "./base";
import { BaseNode, NodeContextFactory } from "./base";
import { DiContainer } from "../types";
import { SetOptional } from "type-fest";
import { isNil } from "lodash";

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
    name: "Thread",
    description: "Thread of messages",
    "x-showSocket": false,
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
  thread: generateSocket({
    name: "Thread",
    type: "NodeThread",
    "x-controller": "thread",
    isMultiple: true,
    "x-key": "self",
    "x-showSocket": true,
  }),
  messages: generateSocket({
    name: "messages",
    type: "array",
    isMultiple: true,
    "x-key": "thread",
    "x-showSocket": true,
  }),
};

export const THREAD = "THREAD";

export enum ThreadMachineEvents {
  addMessage = `${THREAD}.ADD_MESSAGE`,
  addAndRunMessage = `${THREAD}.ADD_AND_RUN_MESSAGE`,
  clearThread = `${THREAD}.CLEAR_THREAD`,
  updateOutputs = `UPDATE_OUTPUTS`,
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
      type: ThreadMachineEvents.updateOutputs;
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
      actions:
        | {
            type: "updateOutput";
          }
        | {
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
                params: MessageCreateParams;
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
      [ThreadMachineEvents.updateOutputs]: {
        actions: ["updateOutput"],
      },
      INITIALIZE: {
        actions: ["initialize"],
      },
      SET_OUTPUT: {
        actions: ["setOutput"],
      },
    },
    states: {
      idle: {
        entry: ["updateOutput"],
        on: {
          [ThreadMachineEvents.addMessage]: {
            actions: enqueueActions(({ enqueue, context, event }) => {
              enqueue({
                type: "addMessage",
                params: {
                  ...event.params,
                },
              });
              enqueue({
                type: "updateOutput",
              });
            }),
            reenter: true,
          },

          [ThreadMachineEvents.clearThread]: {
            actions: enqueueActions(({ enqueue }) => {
              enqueue.assign({
                inputs: ({ context }) => {
                  return {
                    ...context.inputs,
                    messages: [],
                  };
                },
              });
              enqueue({
                type: "updateOutput",
              });
            }),
            reenter: true,
          },

          [ThreadMachineEvents.run]: {
            guard: ({ context }) => {
              return !isNil(context.outputs.onRun);
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
            guard: ({ context }) => {
              return !isNil(context.outputs.onRun);
            },
            actions: enqueueActions(({ enqueue, event }) => {
              enqueue({
                type: "addMessage",
                params: {
                  ...event.params,
                },
              });
              enqueue({
                type: "updateOutput",
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
      updateOutput: enqueueActions(({ enqueue, event, context, check }) => {
        console.log("UPDATE OUTPUTS", event, context);
        enqueue.assign({
          outputs: ({ context }) => {
            return {
              ...context.outputs,
              messages: context.inputs.messages,
            };
          },
        });
      }),
      addMessage: assign({
        inputs: ({ context, event }, params) => {
          const id = params?.id || `message_${createId()}`;
          return {
            ...context.inputs,
            messages: [
              ...context.inputs.messages,
              {
                id,
                ...params,
              },
            ],
          };
        },
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
