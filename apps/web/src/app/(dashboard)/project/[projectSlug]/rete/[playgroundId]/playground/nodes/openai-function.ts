import { ClassicPreset } from "rete";
import { ActionSocket, TextSocket } from "../sockets";
import { DiContainer } from "../editor";
import { generateTextFn } from "../actions";
import { SelectControl } from "../ui/control/control-select";
import { OPENAI_CHAT_MODELS } from "ai-utils.js";

type OPENAI_CHAT_MODELS_KEY = keyof typeof OPENAI_CHAT_MODELS;

type Data = {
  model: OPENAI_CHAT_MODELS_KEY;
  message: string;
};

export class OpenAIFunctionCall extends ClassicPreset.Node<
  {
    prompt: TextSocket;
    exec: ActionSocket;
  },
  { message: ClassicPreset.Socket },
  {
    model: SelectControl<OPENAI_CHAT_MODELS_KEY>;
    prompt: ClassicPreset.InputControl<"text">;
  }
> {
  height = 420;
  width = 280;

  static ID: "openai-function-call";
  private di?: DiContainer;

  constructor(di: DiContainer, data?: Data) {
    super("OpenAI Function Call");
    this.di = di;
    this.addInput(
      "exec",
      new ClassicPreset.Input(new ActionSocket(), "Exec", true)
    );
    this.addControl(
      "model",
      new SelectControl<OPENAI_CHAT_MODELS_KEY>(
        data?.model || "gpt-3.5-turbo",
        "Model",
        [
          ...Object.keys(OPENAI_CHAT_MODELS).map((key) => ({
            key: key as OPENAI_CHAT_MODELS_KEY,
            value: key,
          })),
        ]
      )
    );

    const control = new ClassicPreset.InputControl("text", {
      initial: data?.message || "asda",
      change(value) {
        console.log("ONE", value);
      },
    });
    const input = new ClassicPreset.Input(new TextSocket(), "Prompt");
    input.addControl(control);
    console.log(input);
    this.addInput("prompt", input);

    this.addOutput(
      "message",
      new ClassicPreset.Output(new TextSocket(), "Message")
    );
  }

  async execute() {
    console.log(this);
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      prompt?: string;
      message: string[];
    };
    const control = this.inputs.prompt?.control;
    if (!inputs.prompt) {
      inputs.prompt = control?.value as any
      return; 
    }

    // const res = await generateTextFn({
    //   model: this.controls.model.value,
    //   system: "You are a story write.",
    //   instruction: "Write a story about a story writer.",
    // });

    console.log("executing", "openai-function-call", inputs, control);
  }

  data(): Data {
    return {
      model: this.controls.model.value,
      message: "",
    };
  }

  serialize(): Data {
    return {
      model: this.controls.model.value,
      message: "",
    };
  }
}
