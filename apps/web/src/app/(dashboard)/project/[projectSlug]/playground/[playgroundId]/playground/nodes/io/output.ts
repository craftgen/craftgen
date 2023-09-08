import { createMachine, assign } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { ClassicPreset } from "rete";
import { anySocket, triggerSocket } from "../../sockets";
import { Icons } from "@/components/icons";

const OutputNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "OutputNode",
  types: {} as {
    context: {
      name: string;
    };
    events: {
      type: "SET_NAME";
      name: string;
    };
  },
  context: {
    name: "input",
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        SET_NAME: {
          target: "idle",
          reenter: true,
          actions: assign({
            name: ({ event }) => event.name,
          }),
        },
      },
    },
  },
});

export class Output extends BaseNode<typeof OutputNodeMachine> {
  icon: keyof typeof Icons = "output";
  constructor(di: DiContainer, data: NodeData<typeof OutputNodeMachine>) {
    super("Output", di, data, OutputNodeMachine, {});

    const state = this.actor.getSnapshot();
    this.addInput("trigger", new ClassicPreset.Input(triggerSocket, "trigger"));
    this.addInput("value", new ClassicPreset.Input(anySocket, "value"));

    this.addControl(
      "name",
      new ClassicPreset.InputControl("text", {
        initial: state.context.name,
        change: (v) => {
          this.actor.send({ type: "SET_NAME", name: v });
        },
      })
    );
  }

  execute(_: any, forward: (output: "trigger") => void) {
    const state = this.actor.getSnapshot();
    console.log(`${state.context.name} Output execute`, state.context.value);
    // forward("trigger");
  }

  async data(inputs: any) {
    console.log("Output data", inputs);
    return {
      value: inputs["value"],
    };
  }

  async serialize() {
    return {};
  }
}
