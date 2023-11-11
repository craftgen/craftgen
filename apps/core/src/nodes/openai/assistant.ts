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
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWi1lh1gBcsNSA6HCAGzAGIBhAeQDkAxASQHEB9ZgAkAgu14BRANoAGALqJQqZMVI5kGRSAAeiAKwBOAExU9AZgCMAdj1GjAFkcAOA2YA0IAJ6IjMk2YA2ezMne0MguyMrAF9ojzRMXAIiEnJKGnomAFUABQAREQAVCUEOHl5ZBSQQZVV1TWrdBD0LExkrJwsDRzD2owMPbwQDCycqQLNbMyMLPStLGLiQBOx8QmIyCmpaBkYAJQkAGVYRPMqtWpw1DS0mgICzKmCjM3tWgxH7D8HECxljKhOAJOKx+AzzPwhWLxdCrZIbNLbTL7LLsc7VS7XBqgO5+UwLWwOZyuH4ISwBKgBOwWP4yAJzF5maHLWFJdapLZUABOYDoyCwEBwGCgjAgGjANAwADdkABrCUrNkpTbpHl8gVCqAIIUygDGWCxlXRShUV3qt0Q90ez1e70+3y8vxkztMBkJeicTjmMgs9mZirWysRVEgZuFLDKfEEonE0nkF1NWItwz+VCswT09jp9NBVNJnXG9n6-wM9z8Fkm-tZgYRnNDanD2k2pAlWAAZi2uQAKXzOgCUjAD8I56XrmuNNUT5saPg64w+HS6nRcjlJsz0pizFip926Mk6RiriRrI+oAFdUBADZrReLJTL5VQh+yVefL9fhdrpch9Yb5BPMWnHFZzGMwF06Axl26exSQXKgHAeGQQhaMxQScI84RfYMLyvBsRTALkuWQLkqFQOgDTbYiAFsn2rYdXyoHCPy1HUf2vDQjXjDEpxuGcECiUDwKXUZoNgmR7CocEjC9Z1PScOw9AwpVa1VM8MAwTUqF1HlmNvDAJVYx9nyDTkuTUjThS0nS8K-PV2IwTiqhNOpeOAhA-g+QEPVmeSQgCKwAlJQIDEpPRzHE8tUMZJSTwYsz1M03UAAswF1WUbzFfT7zlBU6Kw0zzMSlK0s1Wy2L-OQAJ47EdF+L0JL0Z12jdMxXgCfcgr0CkjEMWwuu6Yxphi+jg3iiyoC04r0vDAiiJIsiKOo2jjxGgqEss5LUumljv1-epHITFyaqaXx7DGdcrFaOYK3MIKXHgrMkKcZ1-KsDpFhhFb8tU9aJogMBOyooVNQAZXIFtGCqo7k1mIwKS6sD7CCT1LoC0kvhCuwXDmCDQg6YbvuoMbNP+wHgeFMGDSYKQLCcydob42H4YebpkZBaxAsdBAAm3ST2u3fyKy6awCZMn7xqoUmCKB8bKYhqQjDpwDXNq9zbGZxG2dRzmhnmDcQWpTM3rMH0-SWYyVKJwrLKlrkZdB8HqbMJXqph9XTBZpGzvZtGuZGCxC3+VCOh6VpRct7lrb+gHpfJqA5ep+wXYZtymY9zXve10kwrGexQTCJGZA9D5w9PSPfslmO7bjhPIb0ZOzRVpo04R1nM452CAhCpwTZaUsefTOZS7iqPK7J2XHchgIG6TRn3dbr2UY7rmrG6cYeZBFontsdDzbysWrYr237YpyepCsGegNVlvPa15ehi9EwvV9BZWnpGZh9G0eAEczzAP+ICMCbI7Kg7ZOxdlpDIAcFsy7E0sr-f+kAoaN2OnVTMpgmqr3MG1DqXMMbwWkm6RckE8670+phA+5cJZCn4KgIiUAeRECAc2VsHYCIQKatA-eEc4ETRoXQ5ADC4CwGQbPVO9UMHOiwa1QuThSQ826vuawhhILGFLJ-NaEtdTIComRGOgDRFXyaLYNcgQNwVhCNMRq5hfSxCWBgZA-14DVBga+Q6KDkx4B1ogPAG5IJNQCQE4EGj0g7DAO4sRqtwqSR6p0POmZwS+yGH8UYlIQhLnBAjMhLIvqULVPyQUwoIlGMQJvNMGYsz3G9HmLmfwurwUmGEHmoxfTZNccGMcRTuIp1VqvEw3RRjpnEh0Sw7hakFgHkEH0jVHqVj3rkiOTE8LFKbogIsYkZBPEanScEGZXiHnmRQnhUcVmoIQF6Kw5TGnZmqUYUkcMxiuCqYXSYPULAhMPlo6ympTnJgMEXK5mYbm5juVzQIlyHgOFLEjEIpCPlUKKltH53SPF8V8K1SkUQu7yVsGdJG6MgSmArF8Dmrg4YHPIcpWBo9j410dr8xmUQA5vNQn3aYJs5FgpGFQYZJsZgPDAtueFvCqAIIAQy1Ol0JL+Q9LYH07VQSgqGF8S5LgqR9QCl0eYARhWj34fQxhzjnKotTl3EKjUZEm0+OYJVlpfSAhsHndoYUogjF1RXbRuiGAtggBK6+oJrStE9FSYlFrSTzEeO9b0RcWbGHdRLHkv8cCMP4FgXUkTlZnO3J6SkHxLCjBCP830YlMZdX6C8B45gXDxs0mAbQqBk2QD9c3YEYwzX5p7i4U22d6nISBALOYlia0bQoLqXkdBkXGsiS2nN7aaSdqLTBP2-lymGFNuFVebTuHUo9aO8dTaUXTt+K23Nrh52Fu7SvAEURUbWr3EyQ5VKR4VzbLgBgvrD0lPcieudBau3Fq5jJNM9wOi+UzJ0eFnq9Etmbb8JGTx2jxJ5uCyYVhTFUlMJmJ110ojSTsdEIAA */
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
