import { JSONSchemaType } from "ajv";
import { merge, omit } from "lodash-es";
import {
  ChatPrompt,
  generateText,
  OPENAI_CHAT_MODELS,
  OpenAIApiConfiguration,
  OpenAIChatMessage,
  OpenAIChatModel,
  OpenAIChatModelType,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
  type OpenAIChatSettings,
} from "modelfusion";
import { SetOptional, Simplify } from "type-fest";
import {
  assign,
  createMachine,
  fromPromise,
  PromiseActorLogic,
  type StateFrom,
} from "xstate";

import { SelectControl } from "../../controls/select";
import { SliderControl } from "../../controls/slider";
import { JSONSocket } from "../../controls/socket-generator";
import { Input, Output } from "../../input-output";
import {
  JSONSocketPrimitiveTypeKeys,
  MappedType,
  SocketTypeMap,
  triggerSocket,
} from "../../sockets";
import type { DiContainer } from "../../types";
import {
  BaseMachineTypes,
  BaseNode,
  ChangeActionEventType,
  type ParsedNode,
} from "../base";

type OPENAI_CHAT_MODELS_KEY = OpenAIChatModelType;

const mergeSettings = (context: any, event: any) => {
  return merge(context.settings, {
    ...omit(event, "type"),
    openai: {
      ...event?.openai,
      ...(event?.openai?.model && {
        maxCompletionTokens:
          OPENAI_CHAT_MODELS[
            event.openai.model as keyof typeof OPENAI_CHAT_MODELS
          ].contextWindowSize < context.settings?.openai?.maxCompletionTokens!
            ? OPENAI_CHAT_MODELS[
                event.openai.model as keyof typeof OPENAI_CHAT_MODELS
              ].contextWindowSize
            : context.settings.openai.maxCompletionTokens,
      }),
    },
  });
};

export enum OpenAIFunctionCallActions {
  generateText = "generateText",
  completeChat = "completeChat",
  generateJson = "generateJson",
}

interface ActionOutput {
  result: string;
}

interface ActionInput {
  openai: OpenAIChatSettings;
}

interface CompleteChatActionInput extends ActionInput {
  messages: OpenAIChatMessage[];
}

interface GenerateTextActionInput extends ActionInput {
  system: string;
  user: string;
}

interface GenerateJsonActionInput extends ActionInput {
  system: string;
  user: string;
  schema: JSONSchemaType<any>;
}

interface ActionConfig<T extends ActionInput> {
  inputSockets: JSONSocket[];
  outputSockets: JSONSocket[];
  action: {
    type: OpenAIFunctionCallActions;
    inputs: T;
  };
}

const Actions: {
  // [K in OpenAIFunctionCallActions]: ActionConfig<ActionInput>;
  [OpenAIFunctionCallActions.completeChat]: ActionConfig<CompleteChatActionInput>;
  [OpenAIFunctionCallActions.generateText]: ActionConfig<GenerateTextActionInput>;
  [OpenAIFunctionCallActions.generateJson]: ActionConfig<GenerateJsonActionInput>;
} = {
  [OpenAIFunctionCallActions.completeChat]: {
    inputSockets: [
      {
        name: "system",
        type: "string",
        description: "System Message",
        required: false,
        isMultiple: false,
      },
      {
        name: "messages",
        type: "array",
        description: "messages",
        required: false,
        isMultiple: false,
      },
    ] as const,
    outputSockets: [
      {
        name: "result",
        type: "string",
        description: "Result",
        required: true,
        isMultiple: true,
      },
    ],
    action: {
      type: OpenAIFunctionCallActions.completeChat,
      inputs: {} as CompleteChatActionInput,
    },
  },
  [OpenAIFunctionCallActions.generateText]: {
    inputSockets: [
      {
        name: "system",
        type: "string",
        description: "System Message",
        required: false,
        isMultiple: false,
      },
      {
        name: "user",
        type: "string",
        description: "User Prompt",
        required: true,
        isMultiple: false,
      },
    ],
    outputSockets: [
      {
        name: "result",
        type: "string",
        description: "Result",
        required: true,
        isMultiple: true,
      },
    ],
    action: {
      type: OpenAIFunctionCallActions.generateText,
      inputs: {} as GenerateTextActionInput,
    },
  },
  [OpenAIFunctionCallActions.generateJson]: {
    inputSockets: [
      {
        name: "system",
        type: "string",
        description: "JSON",
        required: true,
        isMultiple: false,
      },
      {
        name: "user",
        type: "string",
        description: "User Prompt",
        required: true,
        isMultiple: false,
      },
      {
        name: "object",
        type: "object",
        description: "JSON",
        required: true,
        isMultiple: false,
      },
    ],
    outputSockets: [
      {
        name: "result",
        type: "string",
        description: "Result",
        required: true,
        isMultiple: true,
      },
    ],
    action: {
      type: OpenAIFunctionCallActions.generateJson,
      inputs: {} as GenerateJsonActionInput,
    },
  },
};

type SpecificActionType<T extends OpenAIFunctionCallActions> = {
  type: T;
  inputs?: (typeof Actions)[T]["action"]["inputs"];
};

const inputSockets = [
  {
    name: "system" as const,
    type: "string" as const,
    description: "System Message",
    required: false,
    isMultiple: false,
  },
  {
    name: "messages" as const,
    type: "array" as const,
    description: "messages",
    required: false,
    isMultiple: false,
  },
];

type MyNodeInputs = MappedType<typeof inputSockets>;

const inputs: MyNodeInputs = {
  system: "12",
  messages: [],
};

const OpenAIFunctionCallMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWgDMBXDAYwBcdkM9SsAbegOhwnrAGIBhAeQDkAYgEkA4gH0uACQCCfEQFEA2gAYAuolCpksHJWoaQAD0QAmAJwBWJgGYA7BeUBGE44BsADjP3bAGhABPRGtXK0trR2V7d0dbazMAX3i-NExcQhIKKho6RhY2TgAlAFU+FXUkEC0dPQwDYwQAFncTJhDXE1dnMxjIiws-QMaG6yYzc1cJ22dlC2sLROT0bHxiMhraBmYAJxIMHAwoDghqMBYMADdkAGtTlOX0tayN3J2MPYOEfcu6GrKygyquiydUQTRabQ6XR69n6AUQ0SYDTMyOaDXaJjizgWIDuaVWmWoz22u32hzAWy2yC2TFQ9Cw5AIVIAtkxcSsMuscsS3qTPhdkD8sn81ADtED9BV6rZbK4mCYOhZ3A1bCYmg1lCYBqZ3MpEbNlGYJsF3FM5ti2Q8CdlNkxyZSthxiqURRVATUQQgdWZWtYTDrbMp3K4mo5HFqEPLvWFHA1nAHmnYTOalniOU8uUxSMgmbSwORCiV-q6xe7JYgYu5RuYA2iLK5bF7rOHVVYTMpwuZPCbHBYk0kcSn2Y9CRmszn2PmOIZYOR6acsAR81sABQRZTKACUHAt+M5NrHufzRc0JeBZYQFarXmUtfrjfDaMcTB77QN0sV9dViX7GGQEDgBg7mmI6bKK1RnqA9R4K44bQcmqRDlaRJ5OwYHirU57WMqcptHM0TSk0TZwo09aIso6KuIafomLYDTwfcu7pjarzvFAaGlpBiCdC0NFYWi1jttYAm+MRLhPgG4SxpROrBq49GpsO1q5HaVLsRBRiIGYN5MA4DaOEqtF+l4zbWJWsyyVMIRuPM-ZAYpyEHhOYBqRKnGNJqxGhk+7gWD2DT6i47bdN+8RAA */
  id: "openai-function-call",
  initial: "initial",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        action: {
          type: OpenAIFunctionCallActions.generateText,
        },
        inputs: {
          type: OpenAIFunctionCallActions.generateText,
          user: "",
          system: "",
        },
        inputSockets:
          Actions[OpenAIFunctionCallActions.generateText].inputSockets,
        outputs: {
          result: "",
        },
        outputSockets:
          Actions[OpenAIFunctionCallActions.generateText].outputSockets,
        settings: {
          openai: {
            model: "gpt-3.5-turbo-1106",
            temperature: 0.7,
            maxCompletionTokens: 1000,
          },
        },
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      inputs: MappedType<(typeof Actions)["completeChat"]["inputSockets"]>;
      // | {
      //     type: OpenAIFunctionCallActions.completeChat;
      //     system: string;
      //     messages: ChatPrompt;
      //   }
      // | {
      //     type: OpenAIFunctionCallActions.generateText;
      //     system: string;
      //     user: string;
      //   }
      // | {
      //     type: OpenAIFunctionCallActions.generateJson;
      //     schema: object;
      //     system: string;
      //     user: string;
      //   };

      action:
        | SpecificActionType<OpenAIFunctionCallActions.completeChat>
        | SpecificActionType<OpenAIFunctionCallActions.generateText>
        | SpecificActionType<OpenAIFunctionCallActions.generateJson>;
      outputs: Record<string, any>;
      settings: {
        openai: OpenAIChatSettings;
      };
    };
    context: {
      action:
        | SpecificActionType<OpenAIFunctionCallActions.completeChat>
        | SpecificActionType<OpenAIFunctionCallActions.generateText>
        | SpecificActionType<OpenAIFunctionCallActions.generateJson>;
      inputs: {
        type: OpenAIFunctionCallActions.generateText;
        user: string;
        system: string;
      };
      settings: {
        openai: OpenAIChatSettings;
      };
      validApiKey: boolean | null;
      error: {
        name: string;
        message: string;
      } | null;
    };
    actors:
      | {
          src: "completeChat";
          logic: PromiseActorLogic<
            {
              result: string;
            },
            (typeof Actions)[OpenAIFunctionCallActions.completeChat]["action"]["inputs"]
          >;
        }
      | {
          src: "generateText";
          logic: PromiseActorLogic<
            {
              result: string;
            },
            (typeof Actions)[OpenAIFunctionCallActions.generateText]["action"]["inputs"]
          >;
        }
      | {
          src: "generateStructure";
          logic: PromiseActorLogic<
            any,
            (typeof Actions)[OpenAIFunctionCallActions.generateJson]["action"]["inputs"]
          >;
        };
    actions: any;
    events:
      | ChangeActionEventType<OpenAIFunctionCallActions>
      | {
          type: "CONFIG_CHANGE";
          openai?: Partial<OpenAIChatSettings>;
        }
      | {
          type: "COMPLETE";
          message: string;
        };
  }>,
  states: {
    initial: {
      invoke: {
        src: "check_api_key",
        onDone: {
          target: "idle",
          actions: assign({
            validApiKey: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            validApiKey: false,
            error: ({ event }) => ({
              name: (event.data as Error).name,
              message: (event.data as Error).message,
            }),
          }),
        },
      },
    },
    idle: {
      on: {
        CONFIG_CHANGE: {
          actions: assign({
            settings: ({ context, event }) => mergeSettings(context, event),
          }),
        },
        CHANGE_ACTION: {
          target: "idle",
          actions: ["changeAction"],
          reenter: true,
        },
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.values,
          }),
        },
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
    running: {
      initial: "determineAction",
      states: {
        determineAction: {
          always: [
            {
              guard: ({ context }) =>
                context.action.type === OpenAIFunctionCallActions.completeChat,
              target: "#openai-function-call.running.generateText",
            },
            {
              guard: ({ context }) =>
                context.action.type === OpenAIFunctionCallActions.generateText,
              target: "#openai-function-call.running.generateText",
            },
            {
              guard: ({ context }) =>
                context.action.type === OpenAIFunctionCallActions.generateJson,
              target: "#openai-function-call.running.generateStructure",
            },
          ],
        },
        generateStructure: {
          invoke: {
            src: "generateStructure",
          },
        },
        generateText: {
          entry: [
            assign({
              action: ({ context }) => ({
                type: OpenAIFunctionCallActions.generateText,
                inputs: {
                  openai: context.settings.openai,
                  system: context.inputs.system,
                  user: context.inputs.user,
                },
              }),
            }),
          ],
          invoke: {
            src: "generateText",
            input: ({ context }) => context.action.inputs,
            onDone: {
              target: "#openai-function-call.complete",
              actions: assign({
                outputs: ({ event }) => event.output,
              }),
            },
            onError: {
              target: "#openai-function-call.error",
              actions: ["setError"],
            },
          },
        },
      },
    },
    error: {
      on: {
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.values,
            error: null,
          }),
        },
        CONFIG_CHANGE: {
          actions: assign({
            settings: ({ context, event }) => mergeSettings(context, event),
          }),
        },
        SET_VALUE: {
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.values,
            }),
          }),
        },
      },
    },
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
    },
  },
  output: ({ context }) => context.outputs,
});

export type OpenAINode = ParsedNode<
  "OpenAIFunctionCall",
  typeof OpenAIFunctionCallMachine
>;

export class OpenAIFunctionCall extends BaseNode<
  typeof OpenAIFunctionCallMachine
> {
  static nodeType = "OpenAIFunctionCall";
  static label = "OpenAI Function Call";
  static description = "Node for making OpenAI function calls";
  static icon = "openAI";

  static parse(params: SetOptional<OpenAINode, "type">): OpenAINode {
    return {
      ...params,
      type: "OpenAIFunctionCall",
    };
  }

  apiModel() {
    if (!this.di.variables.has("OPENAI_API_KEY")) {
      throw new Error("MISSING_API_KEY_ERROR: OPENAI_API_KEY");
    }
    const api = new OpenAIApiConfiguration({
      apiKey: this.di.variables.get("OPENAI_API_KEY") as string,
      throttle: throttleMaxConcurrency({ maxConcurrentCalls: 1 }),
      retry: retryWithExponentialBackoff({
        maxTries: 2,
        initialDelayInMs: 1000,
        backoffFactor: 2,
      }),
    });
    return api;
  }

  constructor(di: DiContainer, data: OpenAINode) {
    super("OpenAIFunctionCall", di, data, OpenAIFunctionCallMachine, {
      actors: {
        generateText: fromPromise(async ({ input }) => {
          console.log({ input });
          try {
            const text = await generateText(
              new OpenAIChatModel({
                api: this.apiModel(),
                ...input.openai,
              }).withChatPrompt(),
              [
                {
                  system: input.system,
                },
                {
                  user: input.user,
                },
              ],
            );
            console.log({ text });
            return {
              result: text,
            };
          } catch (e) {
            console.log(e);
            return {
              result: "err",
            };
          }
        }),
        generateStructure: fromPromise(async ({ input }) => {}),
        check_api_key: fromPromise(async () => {
          // TODO: fix this later;
          // const validApiKey = await this.di.api.checkAPIKeyExist({
          //   key: "OPENAI_API_KEY",
          //   projectId: this.projectId,
          // });
          // if (!validApiKey)
          //   throw new Error("MISSING_API_KEY_ERROR: OPENAI_API_KEY");

          return true;
        }),
      },
    });
    this.addInput("trigger", new Input(triggerSocket, "Exec", true));
    this.addOutput("trigger", new Output(triggerSocket, "Exec"));
    const state = this.actor.getSnapshot();

    this.addControl(
      "model",
      new SelectControl<OPENAI_CHAT_MODELS_KEY>(
        () => this.snap.context.settings.openai.model,
        {
          change: (val) => {
            this.actor.send({
              type: "CONFIG_CHANGE",
              openai: {
                model: val,
              },
            });
          },
          placeholder: "Select Model",
          values: [
            ...Object.keys(OPENAI_CHAT_MODELS).map((key) => ({
              key: key as OPENAI_CHAT_MODELS_KEY,
              value: key,
            })),
          ],
        },
      ),
    );

    this.addControl(
      "action",
      new SelectControl(
        () => this.snap.context.action.type as OpenAIFunctionCallActions,
        {
          change: (val: OpenAIFunctionCallActions) => {
            this.actor.send({
              type: "CHANGE_ACTION",
              value: val,
              inputSockets: Actions[val].inputSockets,
              outputSockets: Actions[val].outputSockets,
              action: {
                type: val,
              },
            });
          },
          placeholder: "Select Result Type",
          values: [
            {
              key: OpenAIFunctionCallActions.generateJson,
              value: "Object",
            },
            {
              key: OpenAIFunctionCallActions.generateText,
              value: "Text",
            },
            {
              key: OpenAIFunctionCallActions.completeChat,
              value: "Chat",
            },
          ],
        },
      ),
    );

    this.addControl(
      "temperature",
      new SliderControl(state.context.settings.openai.temperature || 0, {
        change: (val) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            openai: {
              temperature: val,
            },
          });
        },
        max: 1,
        step: 0.01,
      }),
    );
    this.addControl(
      "maxCompletionTokens",
      new SliderControl(
        state.context.settings.openai.maxCompletionTokens || 1024,
        {
          change: (val) => {
            this.actor.send({
              type: "CONFIG_CHANGE",
              openai: {
                maxCompletionTokens: val,
              },
            });
          },
          max: this.contextWindowSize,
          step: 1,
        },
      ),
    );
    this.actor.subscribe((state) => {
      this.syncUI(state);
    });

    this.syncUI(state);
  }

  get contextWindowSize() {
    const state = this.actor.getSnapshot();
    return OPENAI_CHAT_MODELS[
      state.context.settings.openai.model as keyof typeof OPENAI_CHAT_MODELS
    ].contextWindowSize;
  }

  async syncUI(state: StateFrom<typeof OpenAIFunctionCallMachine>) {
    if (this.hasControl("maxCompletionTokens")) {
      this.removeControl("maxCompletionTokens");
    }
    this.addControl(
      "maxCompletionTokens",
      new SliderControl(state.context.settings.openai?.maxCompletionTokens!, {
        change: (val) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            openai: {
              maxCompletionTokens: val,
            },
          });
        },
        max: this.contextWindowSize,
        step: 1,
      }),
    );
  }
}
