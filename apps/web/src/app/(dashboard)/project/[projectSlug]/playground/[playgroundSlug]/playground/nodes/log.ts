import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine, fromPromise } from "xstate";
import { anySocket, triggerSocket } from "../sockets";

const LogNodeMachine = createMachine({
  id: "log",
  context: {
    inputs: {},
    outputs: {},
    error: {},
  },
  types: {} as {
    events: {
      type: "RUN";
      inputs: any;
    };
  },
  initial: "idle",
  states: {
    idle: {
      on: {
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
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
    },
    error: {},
  },
});

export class Log extends BaseNode<typeof LogNodeMachine> {
  static ID: "log";

  constructor(di: DiContainer, data: NodeData<typeof LogNodeMachine>) {
    super("Log", di, data, LogNodeMachine, {
      actors: {
        run: fromPromise(async ({ input }) => {
          console.log("LogNodeMachine RUNNING", input);
          return input.inputs;
        }),
      },
    });

    this.addInput(
      "trigger",
      new ClassicPreset.Input(triggerSocket, "Exec", true)
    );
    this.addInput("foo", new ClassicPreset.Input(triggerSocket, "Foo", true));
    this.addInput("data", new ClassicPreset.Input(anySocket, "Data"));

    this.addOutput("trigger", new ClassicPreset.Output(triggerSocket, "Exec"));
  }

  // async execute(
  //   input: "trigger",
  //   forward: (output: "trigger") => void,
  //   execId?: string
  // ) {
  //   console.log("Execute entry", { input, forward, execId });

  //   this.di.dataFlow?.reset();
  //   const incomers = this.di.graph.incomers(this.id);

  //   incomers.nodes().forEach(async (n) => {
  //     await this.di.dataFlow?.fetch(n.id);
  //   });
  //   const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
  //     data: Promise<any>[];
  //   };

  //   const inputData = await Promise.all(inputs.data);
  //   console.log(inputData);
  //   forward("trigger");
  // }

  // async data() {
  //   return {};
  // }

  serialize() {
    return {};
  }
}
