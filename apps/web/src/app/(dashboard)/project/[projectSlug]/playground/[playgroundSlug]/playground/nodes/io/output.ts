import { createMachine, assign } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { ClassicPreset } from "rete";
import { getSocketByJsonSchemaType, triggerSocket } from "../../sockets";
import {
  JSONSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { createJsonSchema } from "../../utils";

const OutputNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "OutputNode",
  types: {} as {
    context: {
      name: string;
      description: string;
      inputs: JSONSocket[];
      values: {};
      schema: any;
    };
    events:
      | {
          type: "CHANGE";
          name: string;
          description: string;
          inputs: JSONSocket[];
        }
      | {
          type: "SET_VALUE";
          values: Record<string, any>;
        };
  },
  context: {
    name: "output",
    description: "",
    inputs: [],
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
            inputs: ({ event }) => event.inputs,
            name: ({ event }) => event.name,
            description: ({ event }) => event.description,
          }),
          reenter: true,
        },
      },
    },
  },
});

export class Output extends BaseNode<typeof OutputNodeMachine> {
  constructor(di: DiContainer, data: NodeData<typeof OutputNodeMachine>) {
    super("Output", di, data, OutputNodeMachine, {
      actions: {
        create_schema: assign({
          schema: ({ context }) => createJsonSchema(context.inputs),
        }),
      },
    });
    const state = this.actor.getSnapshot();
    this.addInput("trigger", new ClassicPreset.Input(triggerSocket, "trigger"));

    const inputGenerator = new SocketGeneratorControl({
      connectionType: "input",
      name: "Input Sockets",
      ignored: ["trigger"],
      tooltip: "Add Input sockets",
      initial: {
        name: state.context.name,
        description: state.context.description,
        sockets: state.context.inputs,
      },
      onChange: ({ sockets, name, description }) => {
        this.actor.send({
          type: "CHANGE",
          name,
          description,
          inputs: sockets,
        });
      },
    });
    this.addControl("outputGenerator", inputGenerator);
    this.actor.subscribe((state) => {
      // TODO: only update when sockets change
      this.process();
    });
    this.process();
  }

  process() {
    const state = this.actor.getSnapshot();
    const rawTemplate = state.context.inputs as JSONSocket[];

    for (const item of Object.keys(this.inputs)) {
      if (item === "trigger") continue; // don't remove the trigger socket
      if (rawTemplate.find((i: JSONSocket) => i.name === item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      this.removeInput(item);
    }

    for (const item of rawTemplate) {
      if (this.hasInput(item.name)) {
        const input = this.inputs[item.name];
        if (input) {
          input.socket = getSocketByJsonSchemaType(item.type)!;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item.type)!;
      this.addInput(
        item.name,
        new ClassicPreset.Input(socket, item.name, false)
      );
    }
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
