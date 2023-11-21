import { isNull, merge } from "lodash-es";

import "openai/shims/web";

import { OpenAI } from "openai";
import {
  MessageCreateParams,
  ThreadMessage,
} from "openai/resources/beta/threads/messages/messages.mjs";
import { Thread } from "openai/resources/beta/threads/threads.mjs";
import { match } from "ts-pattern";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise, PromiseActorLogic } from "xstate";

import { ThreadControl } from "../../controls/thread";
import { Input, Output } from "../../input-output";
import { triggerSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../base";

export const OpenAIThreadMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWgBcALAJzCwgDocIAbMAYgGUBRAFQH02AJAJRYCCAEQ4BJIQG0ADAF1EoVMlg4COZBnkgAHogAcAJgA0IAJ6IAzOYCclAKwBGAGwAWR-YDsVqbq9OAvn7GaJi4hKTkVDT0DMIiALIsTEwCAOIs0nJIIIrKquqaOgj6TpTOtub25s7FVtW2zs7GZgjO1pSO+uad+rb6ug76zgFB6Nj4xGQUlCQArhgYOBhQlBQQcXCwWDCUAMZEYDsA1mzhFAwQ6mDUGABuyIdXwWNhk1Sz84vLq+uwm9t7B2OpwgCEWdx2WDyGAyGU0ORUag0WUKjkcNg8DSsukc7m8jlsuiaiGc7nM7Xs9ixXSk7n0+nxjmGICeoQmEWmcwWSxWEDWGy2VwBRxOrwYYBIJGQJEoqFokIAZlKALaUFnjYEcj7c778-77YXA0G3ZAQqEw2RwpQI-LIxAU5xSSi4hq2dxo-EOQmmRB9WyUewOKTOezddy2GlMtUvdnvLlfXk-P6C-VA0WwrLwqEFRCo9HuTHY3HYglElr0p26dxuzrufrVHqR0asjWxz48vm-AUyyU7DbnS7XO4PVVN9WvTVx9uJruoHsbI3gyGI82ZBRWrO2hD2x3Ospuqwe+xe5rOXT2Sh9KpOfRSKx3qxugKBEAYZAQOCaKNsiiW3KI7MIFYpZ4IMjYhGO7JRGAv7WkioCFJWlDWO4lRWNYuhSHSXSlq0NieCGUghgSaJdGBzzfm8nKfDBG7wRYtg2ASNLmChAb2FILiNN6CCOGSXT6FYTgkjS4ZBkMz5fi2VHcosKg0f+m7VI6TGkqxgacaWAaOi4BJdLUWmEWRzbjq22oJrq0EZuuCl0S0NJ2BhqkUupDSlhUzhOhizhUj4ui6JYRkQVMpnxh2Sa7CmIoRPJNq2WUfoqSxznsRp3EOvolBBlI5iouYt6kro4kjOB0bBdJoXTtss4mhsMVwdoeiOI6QaOD4aFHliHQ4bYjh2OYDFoa0-mVOYgWlVQ4qSiQdUATipaFe4lB+fUPTeX5t6MhJo7jbsyBKrKYAEJZa5-rFDUIK6pZeL1LGiViTHeVYT5+EAA */
  id: "openai-thread",
  initial: "idle",
  context: ({ input }) =>
    merge(
      {
        inputs: {},
        inputSockets: [
          {
            name: "addMessage",
            type: "object",
          },
        ],
        outputSockets: [
          {
            name: "threadId",
            type: "string",
            description: "Thread ID",
            required: true,
            isMultiple: true,
          },
        ],
        outputs: {
          threadId: null,
        },
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
        }
      | {
          type: "ADD_AND_RUN_MESSAGE";
          params: MessageCreateParams;
        }
      | {
          type: "CLEAR_THREAD";
        };

    actions: {
      type: "setThreadId";
      params?: {
        threadId: string;
      };
    };
    actors:
      | {
          src: "addMessage";
          logic: PromiseActorLogic<
            ThreadMessage,
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
            Thread,
            {
              threadId: string;
            }
          >;
        };
  }>,
  states: {
    idle: {
      always: {
        target: "ready",
        guard: ({ context }) => !isNull(context.settings.threadId),
      },
      on: {
        ADD_MESSAGE: {
          target: "running.addMessage",
        },
        ADD_AND_RUN_MESSAGE: {
          target: "running.addMessageAndRun",
        },
        SET_THREAD_ID: {
          actions: ["setThreadId"],
          target: "ready",
        },
      },
    },
    ready: {
      on: {
        ADD_MESSAGE: {
          target: "running.addMessage",
        },
        ADD_AND_RUN_MESSAGE: {
          target: "running.addMessageAndRun",
        },
        CLEAR_THREAD: {
          target: "idle",
          actions: [
            assign({
              settings: ({ context }) => ({
                ...context.settings,
                threadId: null,
              }),
            }),
          ],
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
        addMessageAndRun: {
          initial: "checkThread",
          entry: [
            assign({
              inputs: ({ context, event }) => ({
                ...context.inputs,
                addMessage: event.params,
              }),
            }),
          ],
          states: {
            checkThread: {
              always: {
                guard: ({ context }) => !isNull(context.settings.threadId),
                target: "process",
              },
              invoke: {
                src: "createThread",
                onDone: {
                  target: "process",
                  actions: [
                    assign({
                      outputs: ({ context, event }) => ({
                        ...context.outputs,
                        threadId: event.output.id,
                      }),
                      settings: ({ context, event }) => ({
                        ...context.settings,
                        threadId: event.output.id,
                      }),
                    }),
                  ],
                },
                onError: {
                  target: "#openai-thread.error",
                  actions: ["setError"],
                },
              },
            },
            process: {
              invoke: {
                src: "addMessageAndRun",
                input: ({ context }) => ({
                  threadId: context.settings.threadId,
                  params: context.inputs.addMessage,
                }),
                onDone: {
                  target: "#openai-thread.complete",
                  actions: ["triggerSuccessors"],
                },
              },
            },
          },
        },
        addMessage: {
          initial: "checkThread",
          entry: [
            assign({
              inputs: ({ context, event }) => ({
                ...context.inputs,
                addMessage: event.params,
              }),
            }),
          ],
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
                  actions: [
                    assign({
                      outputs: ({ context, event }) => ({
                        ...context.outputs,
                        threadId: event.output.id,
                      }),
                      settings: ({ context, event }) => ({
                        ...context.settings,
                        threadId: event.output.id,
                      }),
                    }),
                  ],
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
                input: ({ context }) => ({
                  threadId: context.settings.threadId,
                  params: context.inputs.addMessage,
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
    complete: {
      on: {
        ADD_MESSAGE: {
          target: "running.addMessage",
        },
        ADD_AND_RUN_MESSAGE: {
          target: "running.addMessageAndRun",
        },
      },
      // type: "final",
    },
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
  static category = "OpenAI";
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
          outputs: ({ context, event }) => {
            return match(event)
              .with({ type: "SET_THREAD_ID" }, ({ params }) => {
                return {
                  ...context.outputs,
                  threadId: params.threadId,
                };
              })
              .run();
          },
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
        addMessageAndRun: fromPromise(async ({ input }) => {
          console.log("input addMessage", input);
          const message = await this.openai()?.beta.threads.messages.create(
            input.threadId,
            input.params,
          );
          return message;
        }),
        addMessage: fromPromise(async ({ input }) => {
          console.log("input addMessage", input);
          const message = await this.openai()?.beta.threads.messages.create(
            input.threadId,
            input.params,
          );
          console.log(message);
          return message;
        }),
        createThread: fromPromise(async () => {
          const thread = await this.openai()?.beta.threads.create({});
          console.log("thread", thread);
          return thread;
        }),
        getThread: fromPromise(async ({ input }) => {
          const thread = await this.openai()?.beta.threads.retrieve(
            input.threadId,
          );
          return thread;
        }),
      },
    });

    this.addInput("trigger", new Input(triggerSocket, "trigger", true));
    this.addOutput("trigger", new Output(triggerSocket, "trigger", true));

    this.addControl(
      "Thread Id",
      new ThreadControl(
        () => this.snap.context.settings.threadId || "",
        this.actor,
        {},
      ),
    );
  }

  async execute(
    input: any,
    forward: (output: "trigger") => void,
    executionId: string,
  ) {
    console.log(this.identifier, "@@@", "execute", executionId);
    // this.di.engine.emit({
    //   type: "execution-step-start",
    //   data: {
    //     payload: this,
    //     executionId: executionId!,
    //   },
    // });

    // EARLY RETURN IF NODE IS COMPLETE
    if (this.actor.getSnapshot().matches("complete")) {
      // this.di.engine.emit({
      //   type: "execution-step-complete",
      //   data: {
      //     payload: this,
      //     executionId: executionId,
      //   },
      // });
      if (this.successorNodes.length > 0 && this.outputs.trigger) {
        // forward("trigger");
        // if (this.di.headless) {
        //   await this.triggerSuccesors(executionId);
        // } else {
        forward("trigger");
        // }
        return;
      }
    }

    const inputs = await this.getInputs();
    this.di.logger.log(this.identifier, "INPUTS", inputs, this.actor);
    // this.actor.send({
    //   type: "ADD_MESSAGE",
    //   params: {
    //     content: "Roger Roger app to track your friends around the world!",
    //     role: "user",
    //   },
    // });

    this.actor.subscribe({
      next: (state) => {
        // this.di.engine.emit({
        //   type: "execution-step-update",
        //   data: {
        //     payload: this,
        //     executionId: executionId,
        //   },
        // });
        console.log(this.identifier, "@@@", "next", state.value, state.context);
      },
      complete: async () => {
        this.di.logger.log(this.identifier, "finito Execute", this.outputs);
        // this.di.engine.emit({
        //   type: "execution-step-complete",
        //   data: {
        //     payload: this,
        //     executionId: executionId,
        //   },
        // });

        if (this.successorNodes.length > 0 && this.outputs.trigger) {
          // if (this.di.headless) {
          //   await this.triggerSuccesors(executionId);
          // } else {
          forward("trigger");
          // }
        } else {
          // this.di.engine.emit({
          //   type: "execution-completed",
          //   data: {
          //     payload: this,
          //     output: this.pactor.getSnapshot().output,
          //     executionId,
          //   },
          // });
        }
      },
    });
    // await waitFor(this.pactor, (state) => state.matches("complete"), {
    //   timeout: 1000 * 60 * 5,
    // });
  }
}
