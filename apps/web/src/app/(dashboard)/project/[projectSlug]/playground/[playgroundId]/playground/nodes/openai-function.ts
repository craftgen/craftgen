import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { SelectControl } from "../ui/control/control-select";
import { OPENAI_CHAT_MODELS, OpenAIChatModelType } from "modelfusion";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine, fromPromise } from "xstate";
import { stringSocket, triggerSocket } from "../sockets";
import { generateTextFn } from "../actions";

type OPENAI_CHAT_MODELS_KEY = keyof typeof OPENAI_CHAT_MODELS;

const OpenAIFunctionCallMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgWgDMBXDAYwBcdkM9SsAbegOhwnrAGIBhAeQDkAYgEkA4gH0uACQCCfEQFEA2gAYAuolCpksHJWoaQAD0QAWAEwAaEAE9EARgAcANiZmn7kwHZHJx3c8AvgFWaJi4hCQUVDR0jCxsnABKAKp8KupIIFo6ehgGxghmZgCcrg52ZgCsVraFxZVMAMzKjXbKlZX+nZVBIejY+MRkubQMzABOJBg4GFAcENRgLBgAbsgA1kuhAxHD0aNxkxjTswgza3S56ekG2brR+YiVyspMDsomTg6e1Tb2Zg4mMVgcV3p0fnZniZeiBtuEhlFqAcJlMZnMwONxshxkxUPQsOQCNiALZMOGDSIjWIo45os6rZCXaLXNS3bT3fSZArPV7vT7fX61RpmRpMEyVVrtcHdD4w8m7RExMZMI4nOa8ACyAAUADLyAAqSlZmTuuUeCB5bw+Xx+NXsnhcJhBYK6kNlwVh-XhlP21KYpGQxLxYHISVSNxN7LNXKenSYlU85SqdsKnjMQIlbQ6rqhcq9FL2SL9AaD7FDHEMsHIBKWWAIofGAAo2i8AJQceUIqnKkvB0MRzRRh4xi1VJgvRMVQWIcpi53tHPuj0YZAQOAGTs+otjNk5YegAp4Jwpo95sIFxXI+LsXccvIj4qihzFZROZN-QrfJjeYqeNM+PxAg9TdCyVQ5UVmW9owPRBhRMJhITfadU3TZpJWzCEemA-MFW7OIMSxcYoP3IxECcSpHUzd8hSKMVMylRdoWw89cN9HtAz7MBiM5GCEHIyjWmo+xingt9yJMZpFywoIgA */
  id: "openai-function-call",
  initial: "idle",
  context: {
    model: "gpt-3.5-turbo",
    inputs: {},
    message: "",
  },
  types: {} as {
    context: {
      model: OpenAIChatModelType;
      inputs: Record<string, any[]>;
      message: string;
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
        },
      },
    },
    error: {},
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
          const res = await generateTextFn({
            model: state.context.model,
            user: await input.inputs.prompt[0],
          });
          return res;
        }),
      },
    });
    this.di = di;
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
    const state = this.actor.getSnapshot();
    console.log("OPEN AI GOT TRIGGED", {
      model: state.context.model,
      id: this.id,
      di: this.di,
      engine: this.di.engine,
      dataflow: this.di.dataFlow,
    });

    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      prompt: string;
      message: string[];
    };
    this.actor.send({
      type: "RUN",
      inputs,
    });

    // console.log("inputs", inputs);
    // const res = await generateTextFn({
    //   model: state.context.model,
    //   user: await inputs.prompt[0],
    // });

    // this.actor.send({
    //   type: "COMPLETE",
    //   message: res,
    // });
    this.actor.subscribe((state) => {
      if (state.matches("complete")) {
        console.log("COMPLETE", { message: state.context.message });
        forward("trigger");
      }
    });

    // console.log("executing", "openai-function-call", res);
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
