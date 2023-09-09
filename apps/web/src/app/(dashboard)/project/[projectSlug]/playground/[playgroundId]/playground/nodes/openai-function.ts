import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { SelectControl } from "../ui/control/control-select";
import {
  OPENAI_CHAT_MODELS,
  OpenAIChatModelType,
  OpenAIChatSettings,
} from "modelfusion";
import { BaseNode, NodeData, baseStateMachine } from "./base";
import { assign, createMachine, fromPromise } from "xstate";
import { stringSocket, triggerSocket } from "../sockets";
import { getApiKeyValue, generateTextFn } from "../actions";
import { MISSING_API_KEY_ERROR } from "@/lib/error";
import { Icons } from "@/components/icons";
import { SliderControl } from "../ui/control/control-slider";
import { omit } from "lodash-es";

type OPENAI_CHAT_MODELS_KEY = keyof typeof OPENAI_CHAT_MODELS;

const OpenAIFunctionCallMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWgDMBXDAYwBcdkM9SsAbegOhwnrAGIBhAeQDkAYgEkA4gH0uACQCCfEQFEA2gAYAuolCpksHJWoaQAD0QAmAJwBWJgGYA7BeUBGE44BsADjP3bAGhABPRGtXK0trR2V7d0dbazMAX3i-NExcQhIKKho6RhY2TgAlAFU+FXUkEC0dPQwDYwQAFncTJhDXE1dnMxjIiws-QMaG6yYzc1cJ22dlC2sLROT0bHxiMhraBmYAJxIMHAwoDghqMBYMADdkAGtTlOX0tayN3J2MPYOEfcu6GrKygyquiydUQTRabQ6XR69n6AUQ0SYDTMyOaDXaJjizgWIDuaVWmWoz22u32hzAWy2yC2TFQ9Cw5AIVIAtkxcSsMuscsS3qTPhdkD8sn81ADtED9BV6rZbK4mCYOhZ3A1bCYmg1lCYBqZ3MpEbNlGYJsF3FM5ti2Q8CdlNkxyZSthxiqURRVATUQQgdWZWtYTDrbMp3K4mo5HFqEPLvWFHA1nAHmnYTOalniOU8uUxSMgmbSwORCiV-q6xe7JYgYu5RuYA2iLK5bF7rOHVVYTMpwuZPCbHBYk0kcSn2Y9CRmszn2PmOIZYOR6acsAR81sABQRZTKACUHAt+M5NrHufzRc0JeBZYQFarXmUtfrjfDaMcTB77QN0sV9dViX7GGQEDgBg7mmI6bKK1RnqA9R4K44bQcmqRDlaRJ5OwYHirU57WMqcptHM0TSk0TZwo09aIso6KuIafomLYDTwfcu7pjarzvFAaGlpBiCdC0NFYWi1jttYAm+MRLhPgG4SxpROrBq49GpsO1q5HaVLsRBRiIGYN5MA4DaOEqtF+l4zbWJWsyyVMIRuPM-ZAYpyEHhOYBqRKnGNJqxGhk+7gWD2DT6i47bdN+8RAA */
  id: "openai-function-call",
  initial: "initial",
  context: {
    inputs: {},
    outputs: {},
    settings: {
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 1000,
    },
    validApiKey: null,
    error: null,
  },
  types: {} as {
    context: {
      inputs: Record<string, any[]>;
      outputs: Record<string, any[]>;
      settings: OpenAIChatSettings;
      validApiKey: boolean | null;
      error: {
        name: string;
        message: string;
      } | null;
    };
    events:
      | (OpenAIChatSettings & {
          type: "CONFIG_CHANGE";
        })
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
              name: event.data.name,
              message: event.data.message,
            }),
          }),
        },
      },
    },
    idle: {
      on: {
        CONFIG_CHANGE: {
          actions: assign({
            settings: ({ context, event }) => ({
              ...context.settings,
              ...omit(event, "type"),
              ...(event?.model && {
                maxTokens:
                  context.settings?.maxTokens! >
                  OPENAI_CHAT_MODELS[
                    event.model as keyof typeof OPENAI_CHAT_MODELS
                  ].contextWindowSize
                    ? OPENAI_CHAT_MODELS[
                        event.model as keyof typeof OPENAI_CHAT_MODELS
                      ].contextWindowSize
                    : context.settings?.maxTokens,
              }),
            }),
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
              name: event.data.name,
              message: event.data.message,
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
  height = 420;
  width = 280;

  static ID: "openai-function-call";

  icon: keyof typeof Icons = "openAI";

  constructor(
    di: DiContainer,
    data: NodeData<typeof OpenAIFunctionCallMachine>
  ) {
    super("OpenAI", di, data, OpenAIFunctionCallMachine, {
      actors: {
        run: fromPromise(async ({ input }) => {
          console.log("RUNNING", input);
          const store = di.store.getState();
          const res = await generateTextFn({
            projectId: store.projectId,
            settings: input.settings,
            user: await input.inputs.prompt,
          });
          // const res = new Promise((resolve) => setTimeout(resolve, 5000));
          return { message: res };
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
      new SelectControl<OPENAI_CHAT_MODELS_KEY>(state.context.settings.model, {
        change: (val) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            model: val,
          });
        },
        placeholder: "Select Model",
        values: [
          ...Object.keys(OPENAI_CHAT_MODELS).map((key) => ({
            key: key as OPENAI_CHAT_MODELS_KEY,
            value: key,
          })),
        ],
      })
    );
    this.addControl(
      "temprature",
      new SliderControl(state.context.settings.temperature, {
        change: (val) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            temperature: val,
          });
        },
        max: 1,
        step: 0.01,
      })
    );
    this.addControl(
      "maxTokens",
      new SliderControl(state.context.settings.maxTokens, {
        change: (val) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            maxTokens: val,
          });
        },
        max: this.contextWindowSize,
        step: 1,
      })
    );
    this.actor.subscribe((state) => {
      console.log("OPENAI ACTOR", {
        state,
      });
      if (this.hasControl("maxTokens")) {
        this.removeControl("maxTokens");
      }
      this.addControl(
        "maxTokens",
        new SliderControl(state.context.settings.maxTokens, {
          change: (val) => {
            this.actor.send({
              type: "CONFIG_CHANGE",
              maxTokens: val,
            });
          },
          max: this.contextWindowSize,
          step: 1,
        })
      );
    });

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
      "message",
      new ClassicPreset.Output(stringSocket, "Message")
    );
  }

  get contextWindowSize() {
    const state = this.actor.getSnapshot();
    return OPENAI_CHAT_MODELS[
      state.context.settings.model as keyof typeof OPENAI_CHAT_MODELS
    ].contextWindowSize;
  }

  async execute(input: any, forward: (output: "trigger") => void) {
    try {
      const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
        [x: string]: string;
      };
      const state = this.actor.getSnapshot();
      Object.keys(this.inputs).forEach((key) => {
        if (!inputs[key] && this.inputs[key]?.control) {
          inputs[key] = state.context.inputs[key];
        }
      });

      // Normalize inputs based on if input accepts multipleConnections
      // If not, flatten the value instead of array
      Object.keys(inputs).forEach((key) => {
        if (!this.inputs[key]?.multipleConnections) {
          inputs[key] = Array.isArray(inputs[key])
            ? inputs[key][0]
            : inputs[key];
        }
      });

      this.actor.send({
        type: "RUN",
        inputs,
      });

      this.actor.subscribe((state) => {
        if (state.matches("complete")) {
          console.log("COMPLETE", { outputs: state.context.outputs });
          forward("trigger");
        }
      });
    } catch (error) {
      console.log("ERROR", error);
    }
  }

  async data(inputs: any) {
    let state = this.actor.getSnapshot();
    if (this.inputs.trigger) {
      this.actor.subscribe((newState) => {
        state = newState;
        console.log("state", newState, inputs);
      });
      while (state.matches("running")) {
        console.log("waiting for complete");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return state.context.outputs;
  }

  serialize() {
    return {};
  }
}
