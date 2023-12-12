import { createId } from "@paralleldrive/cuid2";
import { merge } from "lodash-es";
import { MessageCreateParams } from "openai/resources/beta/threads/messages/messages.mjs";
import { SetOptional } from "type-fest";
import {
  assign,
  createMachine,
  enqueueActions,
  fromPromise,
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
  messages: generateSocket({
    name: "messages",
    type: "array",
    isMultiple: true,
    "x-key": "messages",
    "x-showSocket": true,
  }),
};

export const ThreadMachine = createMachine({
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
          type: "updateOutputMessages";
        }
      | {
          type: "addMessage";
          // params: MessageCreateParams;
        };
    events:
      | {
          type: "ADD_MESSAGE";
          params: MessageCreateParams;
        }
      | {
          type: "ADD_AND_RUN_MESSAGE";
          params: MessageCreateParams;
        }
      | {
          type: "CLEAR_THREAD";
        };
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
  states: {
    idle: {
      entry: ["updateOutputMessages"],
      on: {
        ADD_MESSAGE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue({
              type: "addMessage",
            });
            enqueue({
              type: "updateOutputMessages",
            });
          }),
          reenter: true,
        },
        CLEAR_THREAD: {
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
              type: "updateOutputMessages",
            });
          }),
          reenter: true,
        },
        
        ADD_AND_RUN_MESSAGE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue({
              type: "addMessage",
            });
            enqueue({
              type: "updateOutputMessages",
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
    complete: {},
    error: {},
  },
});

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
    super("Thread", di, data, ThreadMachine, {
      actions: {
        updateOutputMessages: assign({
          outputs: ({ context }) => {
            return {
              messages: context.inputs.messages,
            };
          },
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

      actors: {
        addMessage: fromPromise(async ({ input }) => {
          return {};
        }),
      },
    });
  }
}
