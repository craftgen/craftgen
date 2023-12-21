import { createId } from "@paralleldrive/cuid2";
import { merge } from "lodash-es";
import { MessageCreateParams } from "openai/resources/beta/threads/messages/messages.mjs";
import { SetOptional } from "type-fest";
import {
  assign,
  createMachine,
  enqueueActions,
  log,
  PromiseActorLogic,
} from "xstate";

import { generateSocket } from "../controls/socket-generator";
// import { ThreadControl } from "../controls/thread.control";
// import { Input } from "../input-output";
// import { triggerSocket } from "../sockets";
import { DiContainer } from "../types";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  None,
  ParsedNode,
} from "./base";

export enum ThreadActions {
  addMessage = "addMessage",
  addAndRunMessage = "addAndRunMessage",
}

const inputSockets = {
  addMessage: generateSocket({
    name: "addMessage",
    type: "trigger",
    isMultiple: true,
    required: false,
    "x-key": "addMessage",
    "x-showSocket": true,
    "x-event": "ADD_MESSAGE",
  }),
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
    type: "Thread",
    "x-controller": "thread",
    isMultiple: true,
    "x-key": "thread",
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
}

export type ThreadMachineEvent =
  | {
      type: ThreadMachineEvents.addMessage;
      params: MessageCreateParams;
    }
  | {
      type: ThreadMachineEvents.addAndRunMessage;
      params: MessageCreateParams;
    }
  | {
      type: ThreadMachineEvents.clearThread;
    }
  | {
      type: ThreadMachineEvents.updateOutputs;
    };

export const ThreadMachine = createMachine(
  {
    id: "thread",
    context: ({ input }) =>
      merge<typeof input, any>(
        {
          action: {
            type: ThreadActions.addMessage,
          },
          inputs: {
            messages: [],
          },
          inputSockets: {
            ...inputSockets,
          },
          outputs: {
            messages: [],
            thread: {
              name: "Thread",
              description: "Thread of messages",
              schema: {},
            },
          },
          outputSockets: { ...outputSockets },
        },
        input,
      ),
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets> & {
        action:
          | {
              type: ThreadActions.addMessage;
              inputs?: {
                params: MessageCreateParams;
              };
            }
          | {
              type: ThreadActions.addAndRunMessage;
              inputs?: {
                params: MessageCreateParams;
              };
            };
      };
      guards: None;
      context: BaseContextType<typeof inputSockets, typeof outputSockets>;
      actions:
        | {
            type: "updateOutput";
          }
        | {
            type: "addMessage";
            // params: MessageCreateParams;
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
            logic: PromiseActorLogic<Thread, void>;
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
    },
    states: {
      idle: {
        entry: ["updateOutput"],
        on: {
          UPDATE_SOCKET: {
            actions: ["updateSocket"],
          },
          [ThreadMachineEvents.addMessage]: {
            actions: enqueueActions(({ enqueue, context, event }) => {
              console.log("addMessage INSIDE", context, event);
              enqueue(log("addMessage"));
              enqueue({
                type: "addMessage",
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

          [ThreadMachineEvents.addAndRunMessage]: {
            guard: ({ context }) => {
              if (
                context.outputSockets.onRun["x-connection"] &&
                Object.entries(context.outputSockets.onRun["x-connection"])
                  .length > 0
              ) {
                return true;
              }
              return false;
            },
            actions: enqueueActions(({ enqueue }) => {
              enqueue({
                type: "addMessage",
              });
              enqueue({
                type: "updateOutput",
              });
              enqueue({
                type: "triggerSuccessors",
                params: {
                  port: "onRun",
                },
              });
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
              messages: context.inputs.messages,
            };
          },
        });
        const connections = context.outputSockets.messages["x-connection"];
        console.log("CONNECTIONS", connections);

        for (const [target, inputKey] of Object.entries(connections || {})) {
          enqueue({
            type: "syncConnection",
            params: {
              nodeId: target,
              outputKey: "messages",
              inputKey,
            },
          });
        }

        // enqueue(
        //   sendTo(
        //     ({ self }) => {
        //       if (self._parent) {
        //         return self._parent;
        //       }
        //       return createEmptyActor();
        //     },
        //     {
        //       type: "SET_VALUE",
        //       values: {
        //         messages: context.inputs.messages,
        //       },
        //     },
        //   ),
        // );
      }),
      addMessage: assign({
        inputs: ({ context, event }) => {
          const id = `message_${createId()}`;
          return {
            ...context.inputs,
            messages: [
              ...context.inputs.messages,
              {
                id,
                ...event.params,
              },
            ],
          };
        },
      }),
    },
  },
);

export type ThreadNode = ParsedNode<"Thread", typeof ThreadMachine>;

export class Thread extends BaseNode<typeof ThreadMachine> {
  static nodeType = "Thread";
  static label = "Thread";
  static description: "Message Thread";
  static icon = "mails";

  static parse(params: SetOptional<ThreadNode, "type">): ThreadNode {
    return {
      ...params,
      type: "Thread",
    };
  }
  constructor(di: DiContainer, data: ThreadNode) {
    super("Thread", di, data, ThreadMachine, {});
    this.setup();
  }
}
