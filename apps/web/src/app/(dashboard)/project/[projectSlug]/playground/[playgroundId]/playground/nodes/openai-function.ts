import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { SelectControl } from "../ui/control/control-select";
import { OPENAI_CHAT_MODELS, OpenAIChatModelType } from "modelfusion";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine } from "xstate";
import { stringSocket, triggerSocket } from "../sockets";
import { generateTextFn } from "../actions";

type OPENAI_CHAT_MODELS_KEY = keyof typeof OPENAI_CHAT_MODELS;

const OpenAIFunctionCallMachine = createMachine({
  id: "openai-function-call",
  initial: "idle",
  context: {
    model: "gpt-3.5-turbo",
    message: "",
  },
  types: {} as {
    context: {
      model: OpenAIChatModelType;
      message: string;
    };
    events:
      | {
          type: "CONFIG_CHANGE";
          model: OpenAIChatModelType;
        }
      | {
          type: "RUN";
        }
      | {
          type: "COMPLETE";
          message: string;
        };
  },
  states: {
    idle: {
      on: {
        CONFIG_CHANGE: {
          actions: assign({
            model: ({ event }) => event.model,
          }),
        },
        RUN: "running",
      },
    },
    running: {
      on: {
        COMPLETE: {
          target: "complete",
          actions: assign({
            message: ({ event }) => event.message,
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
    exec: typeof triggerSocket;
  },
  { message: typeof stringSocket; exec: typeof triggerSocket },
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
    super("OpenAI Function Call", di, data, OpenAIFunctionCallMachine, {});
    this.di = di;
    this.addInput("exec", new ClassicPreset.Input(triggerSocket, "Exec", true));
    this.addOutput("exec", new ClassicPreset.Output(triggerSocket, "Exec"));
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

    const input = new ClassicPreset.Input(stringSocket, "Prompt");
    this.addInput("prompt", input);

    this.addOutput(
      "message",
      new ClassicPreset.Output(stringSocket, "Message")
    );
  }

  async execute(input: any, forward: (output: "exec") => void) {
    const state = this.actor.getSnapshot();
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      prompt?: string;
      message: string[];
    };

    this.actor.send({
      type: "RUN",
    });

    console.log("inputs", inputs);
    const res = await generateTextFn({
      model: state.context.model,
      system: "You are a story write.",
      user: "Write a story about a story writer.",
    });

    this.actor.send({
      type: "COMPLETE",
      message: res,
    });

    console.log("executing", "openai-function-call", res);

    forward("exec");
  }

  data() {
    const state = this.actor.getSnapshot();
    return {
      message: state.context.message,
    };
  }

  serialize() {
    return {};
  }
}
