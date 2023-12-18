import { createId } from "@paralleldrive/cuid2";
import { merge } from "lodash-es";
import { MessageCreateParams } from "openai/resources/beta/threads/messages/messages.mjs";
import { SetOptional } from "type-fest";
import {
  assign,
  createEmptyActor,
  createMachine,
  enqueueActions,
  log,
  PromiseActorLogic,
  sendTo,
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
  updateOutput = `${THREAD}.UPDATE_OUTPUT`,
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
      type: ThreadMachineEvents.updateOutput;
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
      context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
        // action:
        //   | {
        //       type: ThreadActions.addMessage;
        //       inputs?: {
        //         params: MessageCreateParams;
        //       };
        //     }
        //   | {
        //       type: ThreadActions.addAndRunMessage;
        //       inputs?: {
        //         params: MessageCreateParams;
        //       };
        //     };
        // inputs:
        //   | {
        //       type: ThreadActions.addMessage;
        //       message: string;
        //     }
        //   | {
        //       type: ThreadActions.addAndRunMessage;
        //       message: string;
        //     };
        // messages: ChatPrompt;
        // system: string;
      };
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
      [ThreadMachineEvents.updateOutput]: {
        actions: ["updateOutput"],
      },
    },
    states: {
      idle: {
        entry: ["updateOutput"],
        on: {
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

        enqueue(
          sendTo(
            ({ self }) => {
              if (self._parent) {
                return self._parent;
              }
              return createEmptyActor();
            },
            {
              type: "SET_VALUE",
              values: {
                messages: context.inputs.messages,
              },
            },
          ),
        );
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
  }
}
