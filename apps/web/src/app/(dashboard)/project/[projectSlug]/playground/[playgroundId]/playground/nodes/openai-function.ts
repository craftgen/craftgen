import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { SelectControl } from "../ui/control/control-select";
import { OPENAI_CHAT_MODELS, OpenAIChatModelType } from "modelfusion";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine, fromPromise } from "xstate";
import { stringSocket, triggerSocket } from "../sockets";
import { getApiKeyValue, generateTextFn } from "../actions";
import { MISSING_API_KEY_ERROR } from "@/lib/error";

type OPENAI_CHAT_MODELS_KEY = keyof typeof OPENAI_CHAT_MODELS;

const OpenAIFunctionCallMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWgDMBXDAYwBcdkM9SsAbegOhwnrAGIBhAeQDkAYgEkA4gH0uACQCCfEQFEA2gAYAuolCpksHJWoaQAD0QAmAJwBWJgGYA7BeUBGE44BsADjP3bAGhABPRGtXK0trR2V7d0dbazMAX3i-NExcQhIKKho6RhY2TgAlAFU+FXUkEC0dPQwDYwQAFncTJhDXE1dnMxjIiws-QMaG6yYzc1cJ22dlC2sLROT0bHxiMhraBmYAJxIMHAwoDghqMBYMADdkAGtTlOX0tayN3J2MPYOEfcu6GrKygyquiydUQTRabQ6XR69n6AUQ0SYDTMyOaDXaJjizgWIDuaVWmWoz22u32hzAWy2yC2TFQ9Cw5AIVIAtkxcSsMuscsS3qTPhdkD8sn81ADtED9BV6rZbK4mCYOhZ3A1bCYmg1lCYBqZ3MpEbNlGYJsF3FM5ti2Q8CdlNkxyZSthxiqURRVATUQQgdWZWtYTDrbMp3K4mo5HFqEPLvWFHA1nAHmnYTOalniOU8uUxSMgmbSwORCiV-q6xe7JYgYu5RuYA2iLK5bF7rOHVVYTMpwuZPCbHBYk0kcSn2Y9CRmszn2PmOIZYOR6acsAR81sABQRZTKACUHAt+M5NrHufzRc0JeBZYQFarXmUtfrjfDaMcTB77QN0sV9dViX7GGQEDgBg7mmI6bKK1RnqA9R4K44bQcmqRDlaRJ5OwYHirU57WMqcptHM0TSk0TZwo09aIso6KuIafomLYDTwfcu7pjarzvFAaGlpBiCdC0NFYWi1jttYAm+MRLhPgG4SxpROrBq49GpsO1q5HaVLsRBRiIGYN5MA4DaOEqtF+l4zbWJWsyyVMIRuPM-ZAYpyEHhOYBqRKnGNJqxGhk+7gWD2DT6i47bdN+8RAA */
  id: "openai-function-call",
  initial: "initial",
  context: {
    model: "gpt-3.5-turbo",
    inputs: {},
    message: "",
    validApiKey: null,
    error: null,
  },
  types: {} as {
    context: {
      model: OpenAIChatModelType;
      inputs: Record<string, any[]>;
      message: string;
      validApiKey: boolean | null;
      error: {
        name: string;
        message: string;
      } | null;
    };
    events:
      | {
          type: "CONFIG_CHANGE";
          model: OpenAIChatModelType;
        }
      | {
          type: "RUN";
          inputs: Record<string, any[]>;
        }
      | {
          type: "COMPLETE";
          message: string;
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
            model: ({ event }) => event.model,
          }),
        },
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.inputs,
          }),
        },
      },
    },
    running: {
      invoke: {
        src: "run",
        input: ({ context }) => ({
          model: context.model,
          inputs: context.inputs,
        }),
        onDone: {
          target: "complete",
          actions: assign({
            message: ({ event }) => event.output,
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
          }),
        },
      },
    },
    complete: {
      on: {
        RUN: "running",
      },
      after: {
        1000: "idle",
      },
    },
  },
});

export class OpenAIFunctionCall extends BaseNode<
  typeof OpenAIFunctionCallMachine,
  {
    prompt: typeof stringSocket;
    trigger: typeof triggerSocket;
  },
  { message: typeof stringSocket; trigger: typeof triggerSocket },
  {
    model: SelectControl<OPENAI_CHAT_MODELS_KEY>;
    prompt: ClassicPreset.InputControl<"text">;
  }
> {
  height = 420;
  width = 280;

  static ID: "openai-function-call";

  constructor(
    di: DiContainer,
    data: NodeData<typeof OpenAIFunctionCallMachine>
  ) {
    super("OpenAI Function Call", di, data, OpenAIFunctionCallMachine, {
      actors: {
        run: fromPromise(async ({ input }) => {
          console.log("RUNNING", input);
          const store = di.store.getState();
          const res = await generateTextFn({
            projectId: store.projectId,
            model: state.context.model,
            user: await input.inputs.prompt[0],
          });
          return res;
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
    this.addOutput("trigger", new ClassicPreset.Output(triggerSocket, "Exec"));
    const state = this.actor.getSnapshot();
    this.addControl(
      "model",
      new SelectControl<OPENAI_CHAT_MODELS_KEY>(
        state.context.model,
        "Model",
        [
          ...Object.keys(OPENAI_CHAT_MODELS).map((key) => ({
            key: key as OPENAI_CHAT_MODELS_KEY,
            value: key,
          })),
        ],
        (value) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            model: value,
          });
        }
      )
    );
    this.actor.subscribe((state) => {
      console.log("OPENAI ACTOR", {
        state,
      });
    });

    const input = new ClassicPreset.Input(stringSocket, "Prompt");
    this.addInput("prompt", input);

    this.addOutput(
      "message",
      new ClassicPreset.Output(stringSocket, "Message")
    );
  }

  async execute(input: any, forward: (output: "trigger") => void) {
    try {
      const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
        prompt: string;
      };
      console.log("@@@", inputs);

      this.actor.send({
        type: "RUN",
        inputs,
      });

      this.actor.subscribe((state) => {
        if (state.matches("complete")) {
          console.log("COMPLETE", { message: state.context.message });
          forward("trigger");
        }
      });
    } catch (error) {
      console.log("ERROR", error);
    }
  }

  async data(inputs: any) {
    let state = this.actor.getSnapshot();
    console.log("state", state, inputs);
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

    console.log("Passing DATA ->", { message: state.context.message });

    return {
      message: state.context.message,
    };
  }

  serialize() {
    return {};
  }
}
