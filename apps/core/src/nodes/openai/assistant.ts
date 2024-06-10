import { isNil, merge, omit, omitBy } from "lodash-es";
import dedent from "ts-dedent";

import "openai/shims/web";

import { OPENAI_CHAT_MODELS, type OpenAIChatModelType } from "modelfusion";
import { OpenAI } from "openai";
import type {
  Assistant,
  AssistantUpdateParams,
} from "openai/resources/beta/assistants/assistants.mjs";
import type {
  Run,
  RunCreateParams,
  RunSubmitToolOutputsParams,
} from "openai/resources/beta/threads/runs/runs.mjs";
import { match } from "ts-pattern";
import type { SetOptional } from "type-fest";
import {
  assign,
  createMachine,
  fromPromise,
  raise,
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
    required: true,
    isMultiple: false,
    "x-showSocket": true,
    "x-key": "threadId",
  }),
  RUN: generateSocket({
    name: "trigger",
    type: "trigger",
    description: "Trigger",
    required: false,
    isMultiple: true,
    "x-showSocket": false,
    "x-key": "RUN",
    "x-event": "RUN",
  }),
  name: generateSocket({
    name: "Assistant Name",
    type: "string",
    description: "Assistant Name",
    required: false,
    isMultiple: false,
    "x-showSocket": false,
    "x-key": "name",
  }),
  instructions: generateSocket({
    name: "Instructions",
    type: "string",
    description: "Instructions",
    required: false,
    isMultiple: false,
    "x-showSocket": false,
    "x-key": "instructions",
    "x-controller": "textarea",
  }),
  model: generateSocket({
    name: "Model",
    type: "string",
    description: dedent`
    The model to use for the assistant
    `,
    required: true,
    isMultiple: false,
    "x-showSocket": false,
    "x-key": "model",
    allOf: [
      {
        enum: Object.keys(OPENAI_CHAT_MODELS),
        type: "string" as const,
      },
    ],
    "x-controller": "select",
  }),
};

const outputSockets = {
  trigger: generateSocket({
    name: "trigger",
    type: "trigger",
    description: "Trigger",
    required: false,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "trigger",
    "x-event": "RUN",
  }),
};

export const OpenAIAssistantMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWi1lh1gBcsNSA6HCAGzAGIBhAeQDkAxASQHEB9ZgAkAgu14BRANoAGALqJQqZMVI5kGRSAAeiAEx6AnFT0AOAIx6A7ADYLVg6dMAaEAE9ElgMzGDNq+Ze5gAshoZeXgC+ka5omLgERCTklDT0TACqAAoAIiIAKhKCHDy8sgpIIMqq6pqVugh6MqYyVDZ6waYArDKh5t3drh4IgTbBVMFGDrZ6XX6G0bHo2PiExGQU1LQMjABKEgAyrCI55VrVOGoaWg1dwV1UXv6z5jKGwcFPwUOewbZtXjMpi83XaNmaixAcRWiXWKS26T2GXYZ0qFyudVADS8fyoXTuDhscy6gJsPwQFjxMmpIS8AUMTSsVkh0ISa2SmyoqAATmBeXRkBAcBgoIxtBtSGAqFgAGaS7kACleAEpGKzVkkNqkeXywAKhSLUUoVJdajdPFZfBYOkSOmFOmT3L9mm0ujZAbZDDIbIFzCzlmzNfCqPzkFgDaKIBopcKAG7IADWUvVsI5qVD4eFUAQceQAGMsBjykaqiaMeaEHcHk8HF1Xu9PmNyZZTMZCTZDCT8SD-fENXDORmI4w+dzkNyuXRCzLxwBbKgp9la6hDrM5jDxgtF+Ql9Fm+qIKuPZ51t4fL7NkFeKjmS1Mjrtzq9mFL4OQU0ilglPiCUTiaTyOcZb7liiCTM2rzmI8bqmFYpiTIY4LvM+gYDqk75qJ+4rkJK0pynyCpNNSqqLkGnIYVmu7AdcB6NEYJjWrY9iOC4TojN6VhUIYtgOB0Lx1n6MRQgG-ZpiuACuGAYFmVDiagECFlmjBRhgMYbomyYiamy4hpJ0kirJ8mKSK66bopGjFoBaLUZiOieBYxjwU8t4dtSzTfGx5ghA8TJPDILnunSKGiTp3J6TJckKZhoqjuOk7TnOC5aa+g7hQZkXGdmuZbrUlkVMaNQ0aBIwOVQTk+p6bnwc2MheK0Vg9OYPRdHB55dMF2nBmFUkyXmvKZcp0Y0OpSZJX2nWpT1Bl9WAmWmfm5kYHlQGFbZDQ+qYXE+tS4KtrVXhdOSzxUA11KGLeDK9E8HUpemaVQFQeYABZgHmCZKSpanxqNpFoRJU0Pc9r3vSZ2WLct1mrRWgThDebohE1LRjI6ww+K0YRhI1cEdjYN1kXdAOPS9b1KbFE6oFOpAzty86-WJumE0DJOg+pOUWTuVkFaaRV2SMXTcTe-imP4kEyLW5JBMY-g4rM4T9CSwR439DP6Q9EBgPKs7ClmADKOFMFRUO0a83qPKdwR2C0JJ6CjiAdptfhjFYZ1hOYCxCXToX3VQ6ua9rIp64WBvmPlpZG8VJs2GbPQW04MjW7bCANZxfwi7B7R6HVphK-T3Wqz7Gt8lrquB5KjBSHood7jzDSR9HvSW-HpLkunJ021YTxPAy10e8l+P-fnvtF-7UClwbXhVzZ0M7fXsdW83bH4ptqf8zidUPu1vfjbdA8yUPNMj2P5fBJP4e83XdIx43CdHcErSp0STVzHfwSCUs2-9yre+FwfJf6+XXRT7czWp4Gel8G5xxvmxCwDxuL+A7D0GQRhEI5y9oTfexddb-ykDYIB5ZjZgPNtfBewxwgPD8AEboVhY5GFQV1b2GDD7YKsHgkC59CFX0gSQ-QnYJi2DdJ2ahd8XJ0MmvnAAjuJMAUiIBiglFKWU8olRuRIn3ZWecZKSOkZAQ2wDoY+GvE1H0r8uhIwtkdQwDsbZOxdudd278Xyfw0QZYU-AeTICgLyIgcj9Z4SUSbGQqiP7qO9q49xni4CwF0fgiOBi4bGMRt6cxbEGpR3bNxahSNvSiIJvnPMyBZwU0LrI6JbDa6lXKi5L01JqrQIalxHiwInBMUtNEISGBBRwC0J7eEK09G0TwInQZVA3KjLGW8TsOSEQMD6TE3mTQOgnX6O0ah-DqR6GbBbB4TggSwVdgyPQUyuS8lDBGWZZSwIbM8nfTiRJArOwqj4XGW9HHqL1GGM5kN+nFTqtWMwlgWoNUQh8S88F4lGDuF5HE2SXmoXphREU5ya6HijuYMYzQOiSzpB5YYlgkFlRNk82qLUnywpCvQgGSKQEIAiMYfEfwbbEm4Y0U2fg3TegZPzWYzyHFwrQfnDK0UqUVhBJxelhImU2xqp8Ph-gxbWC9DiN+wlgm529jNTKwraKTHGMCLl9xTDWAtonEWJhrE2B9HVeW2cyUTVyb1YmIMoBaojqYvQXF4J6GWfHUx5JX6bUsESAIpiXK1SOc4tWP9MEB31i63mlooLxxXl2Q1Jr3htwtR3OskwO48pVa8tVhMtEyLjbXAw4xZggjFqkow5gLGcUdlmkI1ge68vJWImSYSxwRKIKWzwTRjDNDdv0boZgO5WHJA1Hy1j8T0gcPHcN6qClFMlBAPtIwvXurCF6tFLYeheBbtQhp-h-Wrz+MyW1O8v4GV5JInAXj+BYDzHM6u1KvIdhMK8WCIRLFegcOSEk142UtRtmEcEitL1OO9mAbQqB72QHXe+3wX6AihD2v+ti7pNrtgMEydovQL1trtbvaaFA8x6joFmRDaLkPNFQ7++VLcQhmv8NQsIvQoWLsZmRijCGvlzNrjRz9dGf3oauaQiIsqHB3ydu8Qj+a+UUvzjKXADA138YuSMITXqRNob-eJnh14JWnTGHWHEEGiNXvyYUhgkp11NFCJ+4WjLwiW0PUZ9u3o9Ud0EtEIAA */
  id: "openai-assistant",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          threadId: null,
          RUN: undefined,
          name: null,
          instructions: null,
          ...input.settings.assistant,
        },
        inputSockets: {
          ...inputSockets,
        },
        outputs: {},
        outputSockets: {
          ...outputSockets,
        },
        settings: {
          run: null,
          assistant: {
            id: input.settings.assistant.id,
            model: "gpt-4-1106-preview" as OpenAIChatModelType,
          },
        },
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: BaseInputType<typeof inputSockets, typeof outputSockets> & {
      inputs: {
        threadId: string | null;
      };
      settings: {
        run: Partial<Run> | null;
        assistant: Partial<Assistant> & {
          id: string | null;
          model: OpenAIChatModelType;
        };
      };
    };
    guards: None;
    context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
      settings: {
        run: Partial<Run> | null;
        assistant: Partial<Assistant> & {
          id: string | null;
          model: OpenAIChatModelType;
        };
      };
    };
    actions: {
      type: "setAssistantId";
      params?: {
        assistantId: string;
      };
    };
    actors:
      | {
          src: "updateAssistant";
          logic: PromiseActorLogic<
            Assistant,
            {
              assistantId: string;
              params: AssistantUpdateParams;
            }
          >;
        }
      | {
          src: "retrieveAssistant";
          logic: PromiseActorLogic<
            Assistant,
            {
              assistantId: string;
            }
          >;
        }
      | {
          src: "createRun";
          logic: PromiseActorLogic<
            Run,
            {
              threadId: string;
              body: RunCreateParams;
            }
          >;
        }
      | {
          src: "retrieveRun";
          logic: PromiseActorLogic<
            Run,
            {
              threadId: string;
              runId: string;
            }
          >;
        }
      | {
          src: "invokeFunction";
          logic: PromiseActorLogic<
            any,
            {
              threadId: string;
              runId: string;
            }
          >;
        }
      | {
          src: "submitToolOutputs";
          logic: PromiseActorLogic<
            Run,
            {
              threadId: string;
              runId: string;
              body: RunSubmitToolOutputsParams;
            }
          >;
        };
    events:
      | {
          type: "SET_ASSISTANT_ID";
          params: {
            assistantId: string;
          };
        }
      | {
          type: "UPDATE_CONFIG";
          config?: Assistant;
        }
      | {
          type: "RELOAD";
        };
  }>,
  initial: "prereloding",
  states: {
    idle: {
      on: {
        RELOAD: {
          target: "reloading",
        },
        SET_VALUE: {
          actions: ["setValue"],
          target: "editing",
        },
        RUN: {
          target: "running",
          guard: ({ context }) => !isNil(context.inputs.threadId),
        },
      },
    },
    prereloding: {
      always: [
        {
          guard: ({ context }) => isNil(context.settings.assistant?.id),
          target: "reloading",
        },
        {
          guard: ({ context }) => !isNil(context.settings.assistant?.id),
          target: "idle",
        },
      ],
    },
    reloading: {
      invoke: {
        src: "retrieveAssistant",
        input: ({ context }) => ({
          assistantId: context.settings.assistant?.id,
        }),
        onDone: {
          target: "idle",
          actions: [
            assign({
              settings: ({ context, event }) => ({
                ...context.settings,
                assistant: event.output,
              }),
            }),
          ],
        },
        onError: {
          target: "idle",
          actions: [raise({ type: "RELOAD" }, { delay: 1000 })],
        },
      },
    },
    editing: {
      on: {
        SET_VALUE: {
          actions: "setValue",
          target: "editing", // self-loop to reset the timer
          reenter: true,
        },
      },
      after: {
        2000: "running.updating",
      },
    },
    running: {
      initial: "creating",
      states: {
        updating: {
          invoke: {
            src: "updateAssistant",
            input: ({ context }) => {
              return {
                assistantId: context.settings.assistant.id,
                params: {
                  ...omit(omitBy(context.settings.assistant, isNil), [
                    "id",
                    "created_at",
                    "object",
                  ]),
                  name: context.inputs.name,
                  instructions: context.inputs.instructions,
                  threadId: context.inputs.threadId,
                  model: context.settings.assistant.model,
                },
              };
            },
            onDone: {
              target: "#openai-assistant.idle",
              actions: [
                raise(({ event }) => ({
                  type: "UPDATE_CONFIG" as const,
                  config: event.output,
                })),
              ],
            },
            onError: {
              target: "#openai-assistant.idle",
              actions: ["setError"],
            },
          },
        },
        creating: {
          invoke: {
            src: "createRun",
            input: ({ context }) => ({
              threadId: context.inputs.threadId,
              body: {
                assistant_id: context.settings.assistant.id,
              },
            }),
            onDone: {
              target: "#openai-assistant.running.determiningState",
              actions: [
                assign({
                  settings: ({ context, event }) => {
                    return {
                      ...context.settings,
                      run: event.output,
                    };
                  },
                }),
              ],
            },
            onError: {
              target: "#openai-assistant.error",
              actions: ["setError"],
            },
          },
        },
        checking: {
          invoke: {
            src: "retrieveRun",
            input: ({ context }) => ({
              threadId: context.inputs.threadId,
              runId: context.settings?.run?.id!,
            }),
            onDone: {
              target: "determiningState",
              actions: [
                assign({
                  settings: ({ context, event }) => {
                    return {
                      ...context.settings,
                      run: event.output,
                    };
                  },
                }),
              ],
            },
            onError: {
              actions: ["setError"],
            },
          },
        },
        determiningState: {
          always: [
            {
              guard: ({ context }) => context.settings.run?.status === "queued",
              target: "queued",
            },
            {
              guard: ({ context }) =>
                context.settings.run?.status === "in_progress",
              target: "in_progress",
            },
            {
              guard: ({ context }) =>
                context.settings.run?.status === "completed",
              target: "completed",
            },
            {
              guard: ({ context }) =>
                context.settings.run?.status === "requires_action",
              target: "requires_action",
            },
            {
              guard: ({ context }) =>
                context.settings.run?.status === "expired",
              target: "expired",
            },
            {
              guard: ({ context }) =>
                context.settings.run?.status === "cancelling",
              target: "cancelling",
            },
            {
              guard: ({ context }) =>
                context.settings.run?.status === "cancelled",
              target: "cancelled",
            },
            {
              guard: ({ context }) => context.settings.run?.status === "failed",
              target: "failed",
            },
          ],
        },
        queued: {
          after: {
            1000: "checking",
          },
        },
        in_progress: {
          after: {
            1000: "checking",
          },
        },
        completed: {
          always: {
            target: "#openai-assistant.complete",
          },
        },
        requires_action: {
          invoke: {
            src: "invokeFunction",
            input: ({ context }) => ({
              threadId: context.inputs.threadId,
              runId: context.settings.run?.id!,
            }),
          },
          states: {},
        },
        expired: {},
        cancelling: {},
        cancelled: {},
        failed: {},
      },
    },
    complete: {
      type: "final",
    },
    error: {},
  },
  output: ({ context }) => context.outputs,
});

export type OpenAIAssistantNode = ParsedNode<
  "OpenAIAssistant",
  typeof OpenAIAssistantMachine
>;

export class OpenAIAssistant extends BaseNode<typeof OpenAIAssistantMachine> {
  static type = "OpenAIAssistant";
  static label = " Assistant";
  static description = "OpenAI Assistant";
  static icon = "bot";
  static section = "OpenAI";

  static parse(
    params: SetOptional<OpenAIAssistantNode, "type">,
  ): OpenAIAssistantNode {
    return {
      ...params,
      type: "OpenAIAssistant",
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

  constructor(di: DiContainer, data: OpenAIAssistantNode) {
    super("OpenAIAssistant", di, data, OpenAIAssistantMachine, {
      actors: {
        updateAssistant: fromPromise(async ({ input }) => {
          console.log("@@", { input });
          return await this.openai().beta.assistants.update(input.assistantId, {
            ...input.params,
          });
        }),
        retrieveAssistant: fromPromise(async ({ input }) => {
          return await this.openai().beta.assistants.retrieve(
            input.assistantId,
          );
        }),
        createRun: fromPromise(async ({ input }) => {
          const run = await this.openai().beta.threads.runs.create(
            input.threadId,
            input.body,
          );
          console.log("@@", { run });
          return run;
        }),
        retrieveRun: fromPromise(async ({ input }) => {
          return await this.openai().beta.threads.runs.retrieve(
            input.threadId,
            input.runId,
          );
        }),
        submitToolOutputs: fromPromise(async ({ input }) => {
          await this.openai()?.beta.threads.runs.list;
          return await this.openai()?.beta.threads.runs.submitToolOutputs(
            input.threadId,
            input.runId,
            input.body,
          );
        }),
      },
      actions: {
        setAssistantId: assign({
          settings: ({ event, context }) => {
            return match(event)
              .with({ type: "SET_ASSISTANT_ID" }, ({ params }) => {
                return {
                  ...context.settings,
                  assistant: {
                    ...context.settings.assistant,
                    id: params.assistantId,
                  },
                };
              })
              .run();
          },
        }),
      },
    });
    this.setup();
    this.setLabel(this.snap.context.settings.assistant.name || "Assistant");
  }
}
