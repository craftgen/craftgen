import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { OPENAI_CHAT_MODELS, OpenAIChatSettings } from "modelfusion";
import { BaseNode, NodeData } from "./base";
import { StateFrom, assign, createMachine, fromPromise } from "xstate";
import { objectSocket, stringSocket, triggerSocket } from "../sockets";
import { getApiKeyValue, generateTextFn, genereteJsonFn } from "../actions";
import { MISSING_API_KEY_ERROR } from "@/lib/error";
import { merge, omit } from "lodash-es";
import { SelectControl } from "../controls/select";
import { SliderControl } from "../controls/slider";

type OPENAI_CHAT_MODELS_KEY = keyof typeof OPENAI_CHAT_MODELS;

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
  context: {
    inputs: {},
    outputs: {},
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
  types: {} as {
    context: {
      inputs: Record<string, any[]>;
      outputs: Record<string, any[]>;
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
    events:
      | {
          type: "CONFIG_CHANGE";
          openai: OpenAIChatSettings;
          resultType: "json" | "text";
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
          inputs: Record<string, any[]>;
        };
  },
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
      on: {
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.inputs,
            error: null,
          }),
        },
      },
      after: {
        1000: "idle",
      },
    },
  },
});

export class OpenAIFunctionCall extends BaseNode<
  typeof OpenAIFunctionCallMachine
> {
  static ID: "openai-function-call";

  constructor(
    di: DiContainer,
    data: NodeData<typeof OpenAIFunctionCallMachine>
  ) {
    super("OpenAIFunctionCall", "OpenAI", di, data, OpenAIFunctionCallMachine, {
      actors: {
        run: fromPromise(async ({ input }) => {
          console.log("RUNNING", input);
          const store = di.store.getState();
          if (input.settings.resultType === "text") {
            const res = await generateTextFn({
              projectId: store.projectId,
              settings: input.settings.openai,
              user: await input.inputs.prompt,
            });
            return { result: res };
          } else {
            const res = await genereteJsonFn({
              projectId: store.projectId,
              settings: input.settings.openai,
              user: await input.inputs.prompt,
              schema: await input.inputs.schema[0],
            });
            return { result: res };
          }
        }),
        check_api_key: fromPromise(async () => {
          console.log("CHECKING API KEY", di.store.getState().projectId);
          const store = di.store.getState();
          const validApiKey = await getApiKeyValue({
            apiKey: "OPENAI_API_KEY",
            projectId: store.projectId,
          });
          console.log("VALID API KEY", validApiKey);
          if (!validApiKey) throw new MISSING_API_KEY_ERROR("OPENAI_API_KEY");

          return !!validApiKey;
        }),
      },
    });
    this.addInput(
      "trigger",
      new ClassicPreset.Input(triggerSocket, "Exec", true)
    );
    const state = this.actor.getSnapshot();

    this.addOutput("trigger", new ClassicPreset.Output(triggerSocket, "Exec"));

    this.addControl(
      "model",
      new SelectControl<OPENAI_CHAT_MODELS_KEY>(
        state.context.settings.openai.model,
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
        }
      )
    );

    this.addControl(
      "type",
      new SelectControl(state.context.settings.resultType, {
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
      })
    );

    this.addControl(
      "temperature",
      new SliderControl(state.context.settings.openai.temperature, {
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
      })
    );
    this.addControl(
      "maxCompletionTokens",
      new SliderControl(state.context.settings.openai.maxCompletionTokens, {
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
      })
    );
    this.actor.subscribe((state) => {
      this.syncUI(state);
    });

    this.syncUI(state);

    const input = new ClassicPreset.Input(stringSocket, "Prompt", false);
    input.addControl(
      new ClassicPreset.InputControl("text", {
        initial: state.context.inputs?.prompt || "",
        change: (value) => {
          this.actor.send({
            type: "SET_VALUE",
            inputs: {
              prompt: input.multipleConnections ? [value] : value,
            },
          });
        },
      })
    );
    this.addInput("prompt", input);
    this.addOutput(
      "result",
      new ClassicPreset.Output(
        state.context.settings.resultType === "json"
          ? objectSocket
          : stringSocket,
        "Output"
      )
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
      })
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
      this.addInput(
        "schema",
        new ClassicPreset.Input(objectSocket, "Schema", true)
      );
    } else {
      if (this.inputs?.schema) {
        this.removeInput("schema");
      }
    }
  }

  async execute(input: any, forward: (output: "trigger") => void) {
    const inputs = this.getInputs();
    this.actor.send({
      type: "RUN",
      inputs,
    });
    await this.waitForState("complete");
    forward("trigger");
  }

  async data() {
    await this.waitForState("complete");
    const state = this.actor.getSnapshot();
    return state.context.outputs;
  }

  serialize() {
    return {};
  }
}
