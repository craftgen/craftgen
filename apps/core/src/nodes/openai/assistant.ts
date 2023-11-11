import { isNil, merge, omit, omitBy } from "lodash-es";

import "openai/shims/web";

import { OPENAI_CHAT_MODELS, OpenAIChatModelType } from "modelfusion";
import { OpenAI } from "openai";
import {
  Assistant,
  AssistantUpdateParams,
} from "openai/resources/beta/assistants/assistants.mjs";
import {
  Run,
  RunCreateParams,
} from "openai/resources/beta/threads/runs/runs.mjs";
import { match } from "ts-pattern";
import { SetOptional } from "type-fest";
import {
  assign,
  createMachine,
  fromPromise,
  PromiseActorLogic,
  raise,
} from "xstate";

import { ButtonControl } from "../../controls/button";
import { InputControl } from "../../controls/input.control";
import { SelectControl } from "../../controls/select";
import { TextareControl } from "../../controls/textarea";
import { Input, Output } from "../../input-output";
import { objectSocket, stringSocket, triggerSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../base";

export const OpenAIAssistantMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWi1lh1gBcsNSA6HCAGzAGIBhAeQDkAxASQHEB9ZgAkAgu14BRANoAGALqJQqZMVI5kGRSAAeiAGwyATFQCsAZgCMAdiMAOACyHDZ2wE4ANCACeiQ0apmevaO9haueiZWelYmAL6xnmiYuAREJOSUNPRMAKoACgAiIgAqEoIcPLyyCkggyqrqmrW6CPauxjJWthaWUdEWMvaePghBJlR+hib2tm6ug1PxiejY+ITEZBTUtAyMAEoSADKsIgXVWvU4ahpaLXpOpr12js5uw4hmwVT2emZmNq4TD0TK4LPYliAkqtUhsMttsvscuxzrVLtcmqA7lYzN8zM5DPZsWYZDI-u8ENjxj0LCYTL83H0IVCUut0lsqAAnMB0ZBYCA4DBQRgQDRgGgYABuyAA1mLmWs0ptMlyeXyBVAEAKpQBjLDo6oopQqK6NW76CzGczWZ5OFweby+EzGCxzPG2IxWH4WJkrFmKuFUSAmwUsCp8QSicTSeQXY3os0IeYyKiez6uJ7OcndAKOUFOkFmcK2Qw+5IK2HsoNqEPaTakMVYABm9Y5AAo-CSAJSMeUwtmZKvqw11OOm5q+LoBVyuKyz34RPQWck08bTIwLQyzEkxUvQ1lK6gAV1QED16uFovFUtlVF7+4Dx9P1Y1WuQuv18mHaLHmN8synM5zoEdJLg6FIElQMi2FaPTunShjegkkK+uW-ZHieZ4hmAHIcsgHJUKgdB6o2eEALa3ihfYHlQj6YS+kpvmeGgGjGqKjjc44IJutgAbOUTAYu5K-BYVDdGELrdCYthprufoVsqh4YBg6pUNqXJ0ReGBiq+N53v67IcopymCqp6nPpqDHvo0LE1EaDQcb+CADFB3xSS4VgWBECFZjSkEzA4MR-DIXmyah1GGUpKnagAFmA2rSueIpaVeMpypR94GUZUWxfF6oWTqTEYDZsb2RiOiINYzhUM5nyhBY1ihHoQkzgEgzBdOVjOEYcRIXp8nUBFxlQKpOUJVhOF4QRRGkCRHLkX1aGcllJkxXFY30QVH5yF+7FlS0YSGHoKZ0qSgSuA48xWEJh1UAYgRQSCM71bYoVUQGg0qRAYAtqRArqgAyuQ9aMDtpUJj0gLVUEPSWG09WZmBbg8fxMj1Z6JgkqCr0ZQpkUmV9P1-YKgN6kwUgWLZI5g5xENUtDfxgqCFpmOSgI8SS9hOg4Lqndj+m40NVAE9hv1DSTwNSIYlPfg55VOYWdOhAzcPM+SMz2KYdJ6MW7oRN0Ja9el-MDctw3C3NRNQOLZNmNLu3gwrUNK7DTMIyM0w4oM9wGJ1HOAnz-VLXjZvfSLlvWyD9h29Tjm007MOM-DLNgQMnpUOd-wEq4wS2NEL2G2Wb2ZcHQuhxbYtA2TJjRyasv7Y7nnO4nqtgQYInmFJi6ONMi4B4tH342XosA5XIN6DX8Y0w39Mu0ny6o0dbShFMufo4dffhabpeExXpMg1YE8-nLceNwnKtu4g3OQVMoTdJ651OBv71bwAjoeYDvxAjC1pXVBNi2rZnIyG7AtTeJc34f0gKDWue0KqdRxDVYI9UGqeSzOdFMvxUYNQxjILGBc9zGyDoLAU-BUC4SgFyIg386wNmbNhQBJJgE9iNoHAew0SFkOQBQuAsBoGT1jvA6qJJarIM9KgsCgIrATCdIuKCTgQg9SQhgZAX14C1FAXCEqMCEx4CamBPA4xzqMOMcYwkT92Q7DAFo-hcs1zpxXoMQkhgPKDHJOjb4s5nF0lzoMNw5jlTcl5PyQU1ij4tGLBrBwm4PLOOzguckxIpHSSwVBFwqN7CDH8dQQcIS2IxzltJHEegxjWCCM4Ypy5syLj6DSYsZgPbgnwXJRatFnyhLrogRwzVXDfGLPxBCsxbBRCyUQ9U7TYEUmKTmf45hOqLikrYBJkNE5lIelYdMPVliFxxibEuakwB0XGQmboGtPgzMzvM2YPlPaHWCs4sEpIDZbIIawreq1cq5LstommoJjBODgtBXBM4XBuKqkMmwWCgj2ELCMth28w673rEcmm1genQRpDOXBXQl5ZkCN8DJUQujFmKU85C2zCFwogZ-ZFsc3ITCiAMaCzg6SRDQVI6FpJinhG3J6WFW8OHkMoWor5Nj9reKEfU2cLo9CAh6KzWk6cwjtD8N0Awzi+V7OQKRQiocIA0uPrSKRhhpy0nMNBSI0k1bFg8X4WkxJ7iklzhqwWXI344EofwLA2obEywmSuI1Jq7Xmq6Mnd2GT06LlkY4Tx6ZnUqTANoVA7rID6rFZECYgazWGstSnToxg5iPLxD8DucaVoUG1NyOgYy8nfNpem41gIg3ZtDYgR6rkLTIOVsFUtw1dQYArXQBgeqa2ioqoajNjas0WpbU5dJ3xcGEl9pYTcpKNHF0Fo2XAQ7U1jvrZmlwzbcU8WzlBZ6B6nTxHiEAA */
  id: "openai-assistant",
  context: ({ input }) =>
    merge(
      {
        inputs: {},
        inputSockets: [],
        outputs: {},
        outputSockets: [],
        settings: {
          run: null,
          assistant: {
            id: null,
            model: "gpt-4-1106-preview" as OpenAIChatModelType,
          },
        },
        error: null,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      settings: {
        run: Partial<Run> | null;
        assistant: Partial<Assistant> & {
          id: string | null;
          model: OpenAIChatModelType;
        };
      };
    };
    context: {
      settings: {
        run: Partial<Run> | null;
        assistant: Partial<Assistant> & {
          id: string | null;
          model: OpenAIChatModelType;
        };
      };
    };
    actions:
      | {
          type: "setAssistantId";
          params?: {
            assistantId: string;
          };
        }
      | {
          type: "updateConfig";
          params?: {
            config: Partial<AssistantUpdateParams>;
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
        };
    events:
      | {
          type: "SET_ASSISTANT_ID";
          params: {
            assistantId: string;
          };
        }
      | {
          type: "CONFIG_CHANGE";
          config?: Partial<AssistantUpdateParams>;
        }
      | {
          type: "UPDATE_CONFIG";
          config?: Assistant;
        }
      | {
          type: "RELOAD";
        };
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        CONFIG_CHANGE: {
          target: "editing",
        },
        UPDATE_CONFIG: {
          actions: ["updateConfig"],
        },
        RELOAD: {
          target: "reloading",
        },
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.values,
          }),
        },
      },
    },
    reloading: {
      invoke: {
        src: "retrieveAssistant",
        input: ({ context }) => ({
          assistantId: context.settings.assistant?.id!,
        }),
        onDone: {
          target: "idle",
          actions: [
            raise(({ event }) => ({
              type: "UPDATE_CONFIG" as const,
              config: event.output,
            })),
          ],
        },
      },
    },
    editing: {
      entry: {
        type: "updateConfig",
      },
      on: {
        CONFIG_CHANGE: {
          actions: "updateConfig",
          target: "editing", // self-loop to reset the timer
          reenter: true,
        },
      },
      after: {
        2000: "updating",
      },
    },
    updating: {
      invoke: {
        src: "updateAssistant",
        input: ({ context }) => ({
          assistantId: context.settings.assistant.id!,
          params: omit(omitBy(context.settings.assistant, isNil), [
            "id",
            "created_at",
            "object",
          ]),
        }),
        onDone: {
          target: "idle",
          actions: [
            raise(({ event }) => ({
              type: "UPDATE_CONFIG" as const,
              config: event.output,
            })),
          ],
        },
        onError: {
          target: "idle",
          actions: ["setError"],
        },
      },
    },
    running: {
      initial: "creating",
      states: {
        creating: {
          invoke: {
            src: "createRun",
            input: ({ context }) => ({
              threadId: context.inputs.threadId,
              body: {
                assistant_id: context.settings.assistant.id!,
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
        requires_action: {},
        expired: {},
        cancelling: {},
        cancelled: {},
        failed: {},
      },
    },
    complete: {
      type: "final",
    },
  },
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
  static category = "OpenAI";

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
        apiKey: this.di.variables.get("OPENAI_API_KEY") as string,
        dangerouslyAllowBrowser: true,
      });
    }
    return this._openai!;
  }

  constructor(di: DiContainer, data: OpenAIAssistantNode) {
    super("OpenAIAssistant", di, data, OpenAIAssistantMachine, {
      actors: {
        updateAssistant: fromPromise(async ({ input }) => {
          return await this.openai().beta.assistants.update(
            input.assistantId,
            input.params,
          );
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
      },
      actions: {
        updateConfig: assign({
          settings: ({ event, context }) => {
            return match(event)
              .with(
                {
                  type: "UPDATE_CONFIG",
                },
                {
                  type: "CONFIG_CHANGE",
                },
                ({ config }) => {
                  return {
                    ...context.settings,
                    config: merge(context.settings.assistant, config),
                  };
                },
              )
              .run();
          },
        }),
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
    this.addInput("trigger", new Input(triggerSocket, "trigger", true));
    this.addOutput("trigger", new Output(triggerSocket, "trigger", true));
    this.addInput("tools", new Input(objectSocket, "tools", true));
    this.addInput("threadId", new Input(stringSocket, "threadId", false));
    this.addControl(
      "name",
      new InputControl(() => this.snap.context.settings.assistant.name || "", {
        change: (value) => {
          console.log("change", value);
          this.actor.send({
            type: "CONFIG_CHANGE",
            config: {
              name: value,
            },
          });
          this.setLabel(value);
        },
      }),
    );

    this.addControl(
      "update",
      new ButtonControl("Update", () => {
        this.actor.send({
          type: "RELOAD",
        });
      }),
    );
    this.addControl(
      "assistantId",
      new InputControl(() => this.snap.context.settings.assistant.id || "", {
        readonly: true,
        change: (value) => {
          console.log("change", value);
          this.actor.send({
            type: "SET_ASSISTANT_ID",
            params: {
              assistantId: value,
            },
          });
        },
      }),
    );
    this.addControl(
      "instructions",
      new TextareControl(
        () => this.snap.context?.settings.assistant.instructions || "",
        {
          change: async (value) => {
            this.actor.send({
              type: "CONFIG_CHANGE",
              config: {
                instructions: value,
              },
            });
          },
        },
      ),
    );
    this.addControl(
      "model",
      new SelectControl<OpenAIChatModelType>(
        () => this.snap.context.settings.assistant.model,
        {
          change: (val) => {
            this.actor.send({
              type: "CONFIG_CHANGE",
              config: {
                model: val,
              },
            });
          },
          placeholder: "Select Model",
          values: [
            ...Object.keys(OPENAI_CHAT_MODELS).map((key) => ({
              key: key as OpenAIChatModelType,
              value: key,
            })),
          ],
        },
      ),
    );
  }
}
