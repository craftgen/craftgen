import { isNull, merge } from "lodash-es";

import "openai/shims/web";

import { OpenAI } from "openai";
import type {
  MessageCreateParams,
  ThreadMessage,
} from "openai/resources/beta/threads/messages/messages.mjs";
import type { Thread } from "openai/resources/beta/threads/threads.mjs";
import { match } from "ts-pattern";
import type { SetOptional } from "type-fest";
import {
  assign,
  createMachine,
  fromPromise,
  type PromiseActorLogic,
} from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { DiContainer } from "../../types";
import {
  BaseNode,
  type BaseContextType,
  type BaseInputType,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "../base";

const inputSockets = {
  threadId: generateSocket({
    name: "threadId",
    type: "string",
    description: "Thread ID",
    required: false,
    isMultiple: false,
    default: null,
    "x-showSocket": false,
    "x-key": "threadId",
    "x-controller": "openai-thread-control",
  }),
  ADD_MESSAGE: generateSocket({
    name: "Add Message",
    type: "trigger",
    description: "Add Message",
    required: false,
    isMultiple: true,
    "x-showSocket": false,
    "x-key": "ADD_MESSAGE",
    "x-event": "ADD_MESSAGE",
  }),
  ADD_MESSAGE_AND_RUN: generateSocket({
    name: "Add Message and Run",
    type: "trigger",
    description: "Add Message and Run",
    required: false,
    isMultiple: true,
    "x-showSocket": false,
    "x-key": "ADD_MESSAGE_AND_RUN",
    "x-event": "ADD_MESSAGE_AND_RUN",
  }),
};
const outputSockets = {
  threadId: generateSocket({
    name: "threadId",
    type: "string" as const,
    description: "Thread ID",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "threadId",
  }),
  onMessageAdded: generateSocket({
    name: "On Message Added",
    type: "trigger" as const,
    description: "On Message Added",
    required: false,
    isMultiple: true,
    "x-showSocket": false,
    "x-key": "onMessageAdded",
    "x-event": "RUN",
  }),
  onRun: generateSocket({
    name: "On Run",
    type: "trigger" as const,
    description: "On Done",
    required: false,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "onRun",
    "x-event": "RUN",
  }),
};

export const OpenAIThreadMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWgBcALAJzCwgDocIAbMAYgEEARFgfQFkBRAZV6YBxbgG0ADAF1EoVMlg4COZBmkgAHogCMANjGUALAE5jAdm0BmTTssmTAGhABPRIbHbK2gKzaThk+YAOL00AJm0AX3CHNExcQlJyKhp6ZjZ2JgA5DgAlAFUMrj4BYXEpJBBZeUVlVQ0EHT0jUwsrFtsHZ3qQzX0DfUtQsRDvNwDI6PRsfGIyCmo6Rl5uABV2ZYAJbO5WdgBJFlLVSoUlFXK6hoNjPxbrTXanLSsTSmMxd91zX319cZAYqbxWZJBYMQ7lY7VM6gC66K7NAZteyPepiEyNVxiTxiN5iL4RKL-SZxGaJSjAxypDg8fhCUSSI5yE41c6IbGGSjdHG+EIBL4BYb6DpaIYvfRuWy6IyeQy-QkAkkJOYUqnpLLsPIFGnFellGRMqG1Nk4zmabmGXn8wXC1G2V4S8yOkyeZ3aAkTWLTJVUFUAYQAMttsmtNtsDgyIQbTkaECFHZQTAFDFZPAF7v0XTa-L08doAmJnrLPKm-gqvcDyQBXDAYHAYKCUCgQThwWBYGBMDAQbLVygAYyIYD7AGtlt6GBBlGBqBgAG7IYfTstAskkau1+uNiDN1vtsCd7u9gdD0fehB1+d9rBQ0rg-VVaOs1GeTSUcxiH5+At46VZ-QhTkf20fRsWCONS2JctV3XOsGybFtYDbDsux7DB+0HEcx2BBgwBIEhkBIShUFoa8ADMCIAW0oZdSWVGDN3g3dkMPNDj0ws8L2QK8b0kO8KijFkYS0F1X30MxuR8EIcTdG0zQCXp+neAIBRMMJnTlD1AVon16Lg7cEKQ-cUKPDDT2wvjIUfITn1fd9P3RM1zF-FEk16dFHS8CxvCCDSiU9Fc6JrWCtx3RC9wPVCiPwvtWwnKcZ3nRdqMggKdKChj9KYoyWKirjW3POcuOvU5bwje9mWhdRhJMUTxJuVTpO0LMQheQZNG8d8auTTwIP87Sq3SvTQsM9CTywxI4owadOKSmjvQGjchoMvdRvY4ECsvYrlFKvV+IfQSqttRpfEsQJ2u0QwbU8cVOSafNsW6WxDF6rT5rXQaQuWmBVrMibcPwwjiLIyjkr6t7dM+rKfvGigNqKniJAsgTKouESDDqswGsMGSUTzACxLdMx7kMfMsRexUK3exbIbC762N+igwTKvaKpjM10XRwxTrTbxLpRIwAOdd5BWulr2pMcmoMC6nGNp6dUGi2LJymhKFyXFL+qp4LZZGhW8sQuHuJK3jmcsg7UZq9HdHqqTsaalFroCSgekdTQAmu0CfEl1L+2QCjiLAAhGFYakijpJH9pRrQvD0HpExxWUcR0G000obFv00Vx3feWVvf6vs-YDoPVUyHJ8kKWkSlN5G2bRgmJKxnHOlCDnxTzWxM6CMxzEiQkMGQCA4FUObgUZSOYzwe3Oknyh3jn+f556PP5uSMAx9Zp9-1kqTXxa4CZVTcxixCXyR9XRJOnKw1N80cxXgtHQzEJoJNFktFXxJ0wTtlIwxnlDXwaDXXtfayJh9CvnckMPMDR7ghFknyTk6d7o1VTCEcC-8waUwhnWBQwCrKHTki8YsPNwEXRAliG0LU9BCzxEEESFg3TLywR9HW4VjKVTNlHBAiYOSQLCGmXQsCbTiUAuYNB+YnLYnMO6Pyr1mEy0ynLCKJkxrejwebRAfIXh8OgYI1Sf49B5gLAwsBNUwhMOgiwxRhllFoT1jFRC6iuGhH-JQAIYDPz6DTHPcwzVPBp2xu7a6zpzDJglhguRliFHDT3E4mM+YnbuMTP0bQ3Qj4PE6EfJ2wx3iWB8LoMQAoe4RIplE7W1iVr0xhhAOJT53buCSfJaRaSXTIk6J4QICYwi6FsKmZM7sLHS3KTE769jWy1OsqEVJs9f7gJdPmTOV04weH6F8OOZoXSnwARWf6BEJkEPkr0QJPRPBSVWaEN+xhnbeGAvoXQ2hWg9RKVLKgBd-b0CDvsi4hzXjQJAmc12cCUSyjvmAox3hJQQt7uEIAA */
  id: "openai-thread",
  initial: "idle",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          threadId: null,
        },
        inputSockets: {
          ...inputSockets,
        },
        outputSockets: {
          ...outputSockets,
        },
        outputs: {
          threadId: null,
        },
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: BaseInputType<typeof inputSockets, typeof outputSockets>;
    context: BaseContextType<typeof inputSockets, typeof outputSockets>;
    guards: None;
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
        guard: ({ context }) => !isNull(context.inputs.threadId),
      },
      on: {
        ADD_MESSAGE: {
          target: "running.addMessage",
        },
        ADD_AND_RUN_MESSAGE: {
          target: "running.addMessageAndRun",
        },
        SET_VALUE: {
          actions: ["setValue"],
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
        SET_VALUE: {
          actions: ["setValue"],
        },
        CLEAR_THREAD: {
          target: "idle",
          actions: [
            assign({
              inputs: ({ context }) => ({
                ...context.inputs,
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
                guard: ({ context }) => !isNull(context.inputs.threadId),
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
                      inputs: ({ context, event }) => ({
                        ...context.inputs,
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
                  threadId: context.inputs.threadId,
                  params: context.inputs.addMessage,
                }),
                onDone: {
                  target: "#openai-thread.complete",
                  actions: [
                    {
                      type: "triggerSuccessors",
                      params: {
                        port: "onRun",
                      },
                    },
                  ],
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
                guard: ({ context }) => !isNull(context.inputs.threadId),
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
                      inputs: ({ context, event }) => ({
                        ...context.inputs,
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
                  threadId: context.inputs.threadId,
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
  static section = "OpenAI";

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
        apiKey: this.di.variables.get("OPENAI_API_KEY")!,
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
          inputs: ({ event, context }) => {
            return match(event)
              .with({ type: "SET_THREAD_ID" }, ({ params }) => {
                return {
                  ...context.inputs,
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
    this.setup();
  }

  // async execute(
  //   input: any,
  //   forward: (output: "trigger") => void,
  //   executionId: string,
  // ) {
  //   console.log(this.identifier, "@@@", "execute", executionId);
  //   // this.di.engine.emit({
  //   //   type: "execution-step-start",
  //   //   data: {
  //   //     payload: this,
  //   //     executionId: executionId!,
  //   //   },
  //   // });

  //   // EARLY RETURN IF NODE IS COMPLETE
  //   if (this.actor.getSnapshot().matches("complete")) {
  //     // this.di.engine.emit({
  //     //   type: "execution-step-complete",
  //     //   data: {
  //     //     payload: this,
  //     //     executionId: executionId,
  //     //   },
  //     // });
  //     if (this.successorNodes.length > 0 && this.outputs.trigger) {
  //       // forward("trigger");
  //       // if (this.di.headless) {
  //       //   await this.triggerSuccesors(executionId);
  //       // } else {
  //       forward("trigger");
  //       // }
  //       return;
  //     }
  //   }

  //   const inputs = await this.getInputs();
  //   this.di.logger.log(this.identifier, "INPUTS", inputs, this.actor);
  //   // this.actor.send({
  //   //   type: "ADD_MESSAGE",
  //   //   params: {
  //   //     content: "Roger Roger app to track your friends around the world!",
  //   //     role: "user",
  //   //   },
  //   // });

  //   this.actor.subscribe({
  //     next: (state) => {
  //       // this.di.engine.emit({
  //       //   type: "execution-step-update",
  //       //   data: {
  //       //     payload: this,
  //       //     executionId: executionId,
  //       //   },
  //       // });
  //       console.log(this.identifier, "@@@", "next", state.value, state.context);
  //     },
  //     complete: async () => {
  //       this.di.logger.log(this.identifier, "finito Execute", this.outputs);
  //       // this.di.engine.emit({
  //       //   type: "execution-step-complete",
  //       //   data: {
  //       //     payload: this,
  //       //     executionId: executionId,
  //       //   },
  //       // });

  //       if (this.successorNodes.length > 0 && this.outputs.trigger) {
  //         // if (this.di.headless) {
  //         //   await this.triggerSuccesors(executionId);
  //         // } else {
  //         forward("trigger");
  //         // }
  //       } else {
  //         // this.di.engine.emit({
  //         //   type: "execution-completed",
  //         //   data: {
  //         //     payload: this,
  //         //     output: this.pactor.getSnapshot().output,
  //         //     executionId,
  //         //   },
  //         // });
  //       }
  //     },
  //   });
  //   // await waitFor(this.pactor, (state) => state.matches("complete"), {
  //   //   timeout: 1000 * 60 * 5,
  //   // });
  // }
}
