import { assign, createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { ClassicPreset } from "rete";
import { getSocketByJsonSchemaType, triggerSocket } from "../../sockets";
import {
  JSONSocket,
  SocketGeneratorControl,
} from "../../ui/control/control-socket-generator";
import { createJsonSchema } from "../../utis";

export const InputNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "InputNode",
  types: {} as {
    context: {
      name: string;
      description: string;
      outputs: JSONSocket[];
      values: {};
      schema: any;
    };
    events:
      | {
          type: "CHANGE";
          name: string;
          description: string;
          outputs: JSONSocket[];
        }
      | {
          type: "SET_VALUE";
          values: Record<string, any>;
        };
  },
  context: {
    name: "input",
    description: "",
    outputs: [],
    values: {},
    schema: {},
  },
  initial: "idle",
  states: {
    idle: {
      entry: {
        type: "create_schema",
      },
      on: {
        SET_VALUE: {
          actions: assign({
            values: ({ event }) => event.values,
          }),
        },
        CHANGE: {
          target: "idle",
          actions: assign({
            outputs: ({ event }) => event.outputs,
            name: ({ event }) => event.name,
            description: ({ event }) => event.description,
          }),
          reenter: true,
        },
      },
    },
  },
});

export class Input extends BaseNode<typeof InputNodeMachine> {
  constructor(di: DiContainer, data: NodeData<typeof InputNodeMachine>) {
    super("Input", "Input", di, data, InputNodeMachine, {
      actions: {
        create_schema: assign({
          schema: ({ context }) => createJsonSchema(context.outputs),
        }),
      },
    });
    const state = this.actor.getSnapshot();
    this.addOutput(
      "trigger",
      new ClassicPreset.Output(triggerSocket, "trigger")
    );
    const outputGenerator = new SocketGeneratorControl({
      connectionType: "output",
      name: "Output Sockets",
      ignored: ["trigger"],
      tooltip: "Add Output sockets",
      initial: {
        name: state.context.name,
        description: state.context.description,
        sockets: state.context.outputs,
      },
      onChange: ({ sockets, name, description }) => {
        this.actor.send({
          type: "CHANGE",
          name,
          description,
          outputs: sockets,
        });
      },
    });
    this.addControl("outputGenerator", outputGenerator);
    this.actor.subscribe((state) => {
      // TODO: only update when sockets change
      this.process();
    });
    this.process();
  }
  process() {
    const state = this.actor.getSnapshot();
    const rawTemplate = state.context.outputs as JSONSocket[];

    for (const item of Object.keys(this.outputs)) {
      if (item === "trigger") continue; // don't remove the trigger socket
      if (rawTemplate.find((i: JSONSocket) => i.name === item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      this.removeOutput(item);
    }

    for (const item of rawTemplate) {
      if (this.hasOutput(item.name)) {
        const output = this.outputs[item.name];
        if (output) {
          output.socket = getSocketByJsonSchemaType(item.type)!;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item.type)!;
      this.addOutput(
        item.name,
        new ClassicPreset.Input(socket, item.name, false)
      );
    }
  }

  execute(_: any, forward: (output: "trigger") => void) {
    const state = this.actor.getSnapshot();
    console.log(`[${state.context.name}] Input execute`, state.context.values);
    forward("trigger");
  }

  data() {
    const state = this.actor.getSnapshot();
    console.log(`[${state.context.name}] Input data`, state.context.values);
    return {
      ...state.context.values,
    };
  }

  async serialize() {
    return {};
  }
}
