import { assign, createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { ClassicPreset } from "rete";
import { anySocket, triggerSocket } from "../../sockets";

const InputNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "InputNode",
  types: {} as {
    context: {
      name: string;
      value: any;
    };
    events:
      | {
          type: "SET_NAME";
          name: string;
        }
      | {
          type: "SET_VALUE";
          value: any;
        };
  },
  context: {
    name: "input",
    value: null,
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
        SET_VALUE: {
          target: "idle",
          reenter: true,
          actions: assign({
            value: ({ event }) => event.value,
          }),
        },
      },
    },
  },
});

export class Input extends BaseNode<typeof InputNodeMachine> {
  constructor(di: DiContainer, data: NodeData<typeof InputNodeMachine>) {
    super("Input", di, data, InputNodeMachine, {});
    const state = this.actor.getSnapshot();
    this.addOutput(
      "trigger",
      new ClassicPreset.Output(triggerSocket, "trigger")
    );
    this.addOutput("value", new ClassicPreset.Output(anySocket, "value"));

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
    console.log(`[${state.context.name}] Input execute`, state.context.value);
    forward("trigger");
  }

  data() {
    const state = this.actor.getSnapshot();
    return {
      value: state.context.value,
    };
  }

  async serialize() {
    return {};
  }
}
