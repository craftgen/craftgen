import { isNull, merge } from "lodash-es";
import { makeObservable, reaction } from "mobx";

import "openai/shims/web";

import openai, { OpenAI } from "openai";
import { MessageCreateParams } from "openai/resources/beta/threads/messages/messages.mjs";
import { Thread } from "openai/resources/beta/threads/threads.mjs";
import { match } from "ts-pattern";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise } from "xstate";

import { ButtonControl } from "../../controls/button";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../base";

export const OpenAIThreadMachine = createMachine({
  id: "openai-thread",
  initial: "idle",
  context: ({ input }) =>
    merge(
      {
        inputs: {},
        inputSockets: [
          {
            name: "threadId",
            type: "string",
            description: "Thread ID",
            required: true,
          },
        ],
        outputSockets: [],
        outputs: {},
        settings: {
          threadId: null,
        },
        error: null,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      settings: {
        threadId: string | null;
      };
    };
    context: {
      settings: {
        threadId: string | null;
      };
    };
    events:
      | {
          type: "SET_THREAD_ID";
          params: {
            threadId: string;
          };
        }
      | {
          type: "ADD_MESSAGE";
          params: MessageCreateParams;
        };
    actions: {
      type: "setThreadId";
      params?: {
        threadId: string;
      };
    };
    actors: any;
  }>,
  states: {
    idle: {
      on: {
        SET_THREAD_ID: {
          reenter: true,
          actions: ["setThreadId"],
        },
        ADD_MESSAGE: {
          target: "running.addMessage",
        },
      },
    },
    running: {
      initial: "init",
      states: {
        init: {
          invoke: {
            src: fromPromise(async ({}) => {
              throw new Error("No Action Defined");
            }),
          },
        },
        addMessage: {
          initial: "checkThread",
          states: {
            checkThread: {
              always: {
                guard: ({ context }) => !isNull(context.settings.threadId),
                target: "process",
              },
              invoke: {
                src: "createThread",
                onDone: {
                  target: "#openai-thread.running.addMessage.process",
                  actions: assign({
                    settings: ({ context, event }) => ({
                      ...context.settings,
                      threadId: event.output.id,
                    }),
                  }),
                },
                onError: {
                  target: "#openai-thread.error",
                  actions: ["setError"],
                },
              },
            },
            process: {
              invoke: {
                src: "addMessage",
                input: ({ context, event }) => ({
                  threadId: context.settings.threadId,
                  event,
                }),
                onDone: {
                  target: "#openai-thread.complete",
                },
              },
            },
          },
        },
      },
    },
    error: {},
    complete: {},
  },
});

export type OpenAIThreadNode = ParsedNode<
  "OpenAIThread",
  typeof OpenAIThreadMachine
>;
export class OpenAIThread extends BaseNode<typeof OpenAIThreadMachine> {
  static nodeType = "OpenAIThread";
  static label = "OpenAI Thread";
  static description = "Thread node for OpenAI";
  static icon = "mails";
  public readonly variables = ["OPENAI_API_KEY"];

  static parse(
    params: SetOptional<OpenAIThreadNode, "type">,
  ): OpenAIThreadNode {
    return {
      ...params,
      type: "OpenAIThread",
    };
  }

  private _openai: OpenAI | undefined;

  openai(): OpenAI {
    if (this._openai) {
      return this._openai;
    }
    if (this.di.variables.has("OPENAI_API_KEY")) {
      this._openai = new OpenAI({
        apiKey: this.di.variables.get("OPENAI_API_KEY") as string,
        dangerouslyAllowBrowser: true,
      });
    }
    return this._openai!;
  }

  constructor(di: DiContainer, data: OpenAIThreadNode) {
    super("OpenAIThread", di, data, OpenAIThreadMachine, {
      actions: {
        setThreadId: assign({
          settings: ({ event, context }) => {
            return match(event)
              .with({ type: "SET_THREAD_ID" }, ({ params }) => {
                return {
                  ...context.settings,
                  threadId: params.threadId,
                };
              })
              .run();
          },
        }),
      },
      actors: {
        addMessage: fromPromise(async ({ input }) => {
          console.log("input addMessage", input);
          const message = await this.openai()?.beta.threads.messages.create(
            input.threadId,
            {
              role: "user",
              content:
                "I need to solve the equation `3x + 11 = 14`. Can you help me?",
            },
          );
          return message;
        }),
        createThread: fromPromise(async ({ input }) => {
          try {
            console.log("input createThread", input);
            const thread = await this.openai()?.beta.threads.create({});
            console.log("thread", thread);
            return thread;
          } catch (e) {
            console.log("e", e);
          }
        }),
        getThread: fromPromise(async ({ input }) => {
          const thread = await this.openai()?.beta.threads.retrieve(
            input.threadId,
          );
          return thread;
        }),
      },
    });

    makeObservable(this, {});

    this.addControl(
      "add",
      new ButtonControl("Create Thread", () => {
        this.actor.send({
          type: "ADD_MESSAGE",
          params: {
            content: "Hello, world!",
            role: "user",
          },
        });
      }),
    );

    // reaction(
    //   () => this.snap.context.settings.threadId,
    //   (threadId: string | null) => {
    //     if (isNull(threadId)) {
    //       this.actor.send({
    //         type: "",
    //       });
    //     }
    //   },
    // );
  }
}
