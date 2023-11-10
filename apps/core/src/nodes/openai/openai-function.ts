import { merge, omit } from "lodash-es";
import {
  OPENAI_CHAT_MODELS,
  OpenAIChatModelType,
  type OpenAIChatSettings,
} from "modelfusion";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise, type StateFrom } from "xstate";

import { SelectControl } from "../../controls/select";
import { SliderControl } from "../../controls/slider";
import { TextareControl } from "../../controls/textarea";
import { Input, Output } from "../../input-output";
import { objectSocket, stringSocket, triggerSocket } from "../../sockets";
import type { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, type ParsedNode } from "../base";

// import { generateTextFn, genereteJsonFn } from "./actions";

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

const OpenAIFunctionCallMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWgDMBXDAYwBcdkM9SsAbegOhwnrAGIBhAeQDkAYgEkA4gH0uACQCCfEQFEA2gAYAuolCpksHJWoaQAD0QAmAJwBWJgGYA7BeUBGE44BsADjP3bAGhABPRGtXK0trR2V7d0dbazMAX3i-NExcQhIKKho6RhY2TgAlAFU+FXUkEC0dPQwDYwQAFncTJhDXE1dnMxjIiws-QMaG6yYzc1cJ22dlC2sLROT0bHxiMhraBmYAJxIMHAwoDghqMBYMADdkAGtTlOX0tayN3J2MPYOEfcu6GrKygyquiydUQTRabQ6XR69n6AUQ0SYDTMyOaDXaJjizgWIDuaVWmWoz22u32hzAWy2yC2TFQ9Cw5AIVIAtkxcSsMuscsS3qTPhdkD8sn81ADtED9BV6rZbK4mCYOhZ3A1bCYmg1lCYBqZ3MpEbNlGYJsF3FM5ti2Q8CdlNkxyZSthxiqURRVATUQQgdWZWtYTDrbMp3K4mo5HFqEPLvWFHA1nAHmnYTOalniOU8uUxSMgmbSwORCiV-q6xe7JYgYu5RuYA2iLK5bF7rOHVVYTMpwuZPCbHBYk0kcSn2Y9CRmszn2PmOIZYOR6acsAR81sABQRZTKACUHAt+M5NrHufzRc0JeBZYQFarXmUtfrjfDaMcTB77QN0sV9dViX7GGQEDgBg7mmI6bKK1RnqA9R4K44bQcmqRDlaRJ5OwYHirU57WMqcptHM0TSk0TZwo09aIso6KuIafomLYDTwfcu7pjarzvFAaGlpBiCdC0NFYWi1jttYAm+MRLhPgG4SxpROrBq49GpsO1q5HaVLsRBRiIGYN5MA4DaOEqtF+l4zbWJWsyyVMIRuPM-ZAYpyEHhOYBqRKnGNJqxGhk+7gWD2DT6i47bdN+8RAA */
  id: "openai-function-call",
  initial: "initial",
  context: ({ input }) =>
    merge(
      {
        inputs: {},
        inputSockets: [],
        outputs: {},
        outputSockets: [],
        settings: {
          openai: {
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            maxCompletionTokens: 1000,
          },
          resultType: "text",
        },
        validApiKey: null,
        error: null,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      inputs:
        | Record<string, any>
        | {
            prompt: string;
          };
      outputs: Record<string, any>;
      settings: {
        openai: OpenAIChatSettings;
        resultType: "json" | "text";
      };
    };
    context: {
      settings: {
        openai: OpenAIChatSettings;
        resultType: "json" | "text";
      };
      validApiKey: boolean | null;
      error: {
        name: string;
        message: string;
      } | null;
    };
    actions: any;
    events:
      | {
          type: "CONFIG_CHANGE";
          openai?: Partial<OpenAIChatSettings>;
          resultType?: "json" | "text";
        }
      | {
          type: "RUN";
          inputs: Record<string, any[]>;
        }
      | {
          type: "COMPLETE";
          message: string;
        }
      | {
          type: "SET_VALUE";
          inputs: Record<string, any>;
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

        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.inputs,
          }),
        },
        SET_VALUE: {
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
          }),
        },
      },
    },
    running: {
      invoke: {
        src: "run",
        input: ({ context }) => ({
          settings: context.settings,
          inputs: context.inputs,
        }),
        onDone: {
          target: "complete",
          actions: assign({
            outputs: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => ({
              name: (event.data as Error).name,
              message: (event.data as Error).message,
            }),
          }),
        },
      },
    },
    error: {
      on: {
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.inputs,
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
              ...event.inputs,
            }),
          }),
        },
      },
    },
    complete: {
      type: "final",
    },
  },
  // output: ({ context }) => context.outputs,
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

  constructor(di: DiContainer, data: OpenAINode) {
    super("OpenAIFunctionCall", di, data, OpenAIFunctionCallMachine, {
      actors: {
        run: fromPromise(async ({ input }) => {
          const inputs = await input.inputs;
          console.log("RUNNING", {
            inputs,
            settings: input.settings,
          });
          if (input.settings.resultType === "text") {
            // const res = await generateTextFn({
            //   projectId: this.di.projectId,
            //   settings: input.settings.openai,
            //   user: inputs.prompt,
            // });
            // return { result: res };
          } else {
            // const res = await genereteJsonFn({
            //   projectId: this.di.projectId,
            //   settings: input.settings.openai,
            //   user: inputs.prompt,
            //   schema: inputs.schema[0],
            // });
            // return { result: res };
          }
          return { result: "test" };
        }),
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
    const state = this.actor.getSnapshot();

    this.addOutput("trigger", new Output(triggerSocket, "Exec"));

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
      "type",
      new SelectControl(() => this.snap.context.settings.resultType, {
        change: (val) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            resultType: val,
          });
        },
        placeholder: "Select Result Type",
        values: [
          {
            key: "json",
            value: "Object",
          },
          {
            key: "text",
            value: "Text",
          },
        ],
      }),
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

    const input = new Input(stringSocket, "Prompt", false);
    input.addControl(
      new TextareControl(() => this.snap.context.inputs?.prompt, {
        change: (value) => {
          this.actor.send({
            type: "SET_VALUE",
            inputs: {
              prompt: input.multipleConnections ? [value] : value,
            },
          });
        },
      }),
    );
    this.addInput("prompt", input);
    this.addOutput(
      "result",
      new Output(
        state.context.settings.resultType === "json"
          ? objectSocket
          : stringSocket,
        "Output",
      ),
    );
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
    if (state.context.settings.resultType === "json") {
      if (this.outputs?.result) {
        this.outputs.result.socket = objectSocket;
      }
    } else {
      if (this.outputs?.result) {
        this.outputs.result.socket = stringSocket;
      }
    }
    if (state.context.settings.resultType === "json") {
      if (this.inputs?.schema) return;
      this.addInput("schema", new Input(objectSocket, "Schema", true));
    } else {
      if (this.inputs?.schema) {
        this.removeInput("schema");
      }
    }
  }
}
