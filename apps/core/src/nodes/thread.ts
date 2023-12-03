import { merge } from "lodash-es";
import { ChatPrompt } from "modelfusion";
import { MessageCreateParams } from "openai/resources/beta/threads/messages/messages.mjs";
import { SetOptional } from "type-fest";
import { createMachine, fromPromise, PromiseActorLogic } from "xstate";

import { ThreadControl } from "../controls/thread.control";
import { Input } from "../input-output";
import { triggerSocket } from "../sockets";
import { DiContainer } from "../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "./base";

export enum ThreadActions {
  addMessage = "addMessage",
  addAndRunMessage = "addAndRunMessage",
}

export const ThreadMachine = createMachine({
  id: "thread",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        action: {
          type: ThreadActions.addMessage,
        },
        inputs: {},
        inputSockets: {},
        // {
        //   type: "string",
        //   name: "system",
        //   description: "System message",
        //   required: false,
        // },
        // {
        //   type: "array",
        //   name: "messages",
        //   isMultiple: true,
        //   required: false,
        // },
        outputs: {},
        outputSockets: {
          system: {
            name: "system",
            type: "string",
            isMultiple: true,
            required: false,
          },
          messages: {
            name: "messages",
            type: "array",
            isMultiple: true,
            required: true,
          },
        },
        // messages: [],
        // system: "You are a helpful, respectful and honest assistant.",
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
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
    context: {
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
      inputs:
        | {
            type: ThreadActions.addMessage;
            message: string;
          }
        | {
            type: ThreadActions.addAndRunMessage;
            message: string;
          };
      messages: ChatPrompt;
      system: string;
    };
    actions: any;
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
      on: {
        ADD_MESSAGE: {
          target: "running.addMessage",
        },
        ADD_AND_RUN_MESSAGE: {
          target: "running.addMessageAndRun",
        },
      },
    },
    running: {
      initial: "determineAction",
      states: {
        determineAction: {
          invoke: {
            src: fromPromise(async ({}) => {
              throw new Error("No Action Defined");
            }),
          },
        },
        addMessage: {
          invoke: {
            src: "addMessage",
            input: ({ context }) => ({
              params: context.inputs.addMessage,
            }),
            onDone: {
              target: "#thread.complete",
            },
            onError: {
              target: "#thread.error",
              actions: ["setError"],
            },
          },
        },
        addMessageAndRun: {
          invoke: {
            src: "addMessage",
            input: ({ context }) => ({
              params: context.inputs.addMessage,
            }),
            onDone: {
              target: "#thread.complete",
              actions: ["triggerSuccessors"],
            },
            onError: {
              target: "#thread.error",
              actions: ["setError"],
            },
          },
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
      actors: {
        addMessage: fromPromise(async ({ input }) => {
          return {};
        }),
      },
    });
    this.addControl("thread", new ThreadControl(this.actor, {}));
    this.addOutput("trigger", new Input(triggerSocket, "trigger"));
  }
}
