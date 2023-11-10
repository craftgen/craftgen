import { isNil, merge, omit, omitBy } from "lodash-es";

import "openai/shims/web";

import { makeObservable, observable, reaction } from "mobx";
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
import { Input } from "../../input-output";
import { objectSocket, stringSocket, triggerSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../base";

export const OpenAIAssistantMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGiwAcwMBDASwFpTZZzYAXUjB-EQrOh8rDNgD0QBGAEzoAnsJHIZyIA */
  id: "openai-assistant",
  context: ({ input }) =>
    merge(
      {
        inputs: {},
        inputSockets: [],
        outputs: {},
        outputSockets: [],
        settings: {
          assistantId: null,
          config: {
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
        assistantId: string | null;
        config: {
          model: OpenAIChatModelType;
        };
      };
    };
    context: {
      settings: {
        assistantId: string | null;
        config: Partial<Assistant> & {
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
      },
    },
    reloading: {
      invoke: {
        src: "retrieveAssistant",
        input: ({ context }) => ({
          assistantId: context.settings.assistantId!,
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
          assistantId: context.settings.assistantId!,
          params: omit(omitBy(context.settings.config, isNil), [
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
          return await this.openai().beta.threads.runs.create(
            input.threadId,
            input.body,
          );
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
                    config: merge(context.settings.config, config),
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
                  assistantId: params.assistantId,
                };
              })
              .run();
          },
        }),
      },
    });
    this.addInput("trigger", new Input(triggerSocket, "trigger", true));
    this.addInput("tools", new Input(objectSocket, "tools", true));
    this.addInput("threadId", new Input(stringSocket, "threadId", false));
    this.addControl(
      "name",
      new InputControl(() => this.snap.context.settings.config.name || "", {
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
      new InputControl(() => this.snap.context.settings.assistantId || "", {
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
        () => this.snap.context?.settings.config.instructions || "",
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
        () => this.snap.context.settings.config.model,
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
