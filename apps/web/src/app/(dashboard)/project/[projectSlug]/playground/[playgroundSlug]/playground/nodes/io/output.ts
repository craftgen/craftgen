import { createMachine, assign } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { getSocketByJsonSchemaType, triggerSocket } from "../../sockets";
import {
  JSONSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { createJsonSchema } from "../../utils";
import { Input } from "../../input-output";
import { merge } from "lodash-es";

const OutputNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "OutputNode",
  context: ({ input }) =>
    merge(
      {
        name: "Output",
        description: "",
        inputSockets: [],
        inputs: {},
        outputs: {},
        schema: {},
      },
      input
    ),
  types: {} as {
    input: {
      name: string;
      description: string;
      inputSockets: JSONSocket[];
      inputs: Record<string, any>;
      outputs: Record<string, any>;
      schema: any;
    };
    context: {
      name: string;
      description: string;
      inputSockets: JSONSocket[];
      inputs: Record<string, any>;
      outputs: Record<string, any>;
      schema: any;
    };
    events:
      | {
          type: "CHANGE";
          name: string;
          description: string;
          inputSockets: JSONSocket[];
        }
      | {
          type: "SET_VALUE";
          values: Record<string, any>;
        }
      | {
          type: "RUN";
          inputs: Record<string, any>;
        };
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
            inputs: ({ event }) => event.values,
            outputs: ({ event }) => event.values,
          }),
        },
        CHANGE: {
          target: "idle",
          actions: assign({
            inputSockets: ({ event }) => event.inputSockets,
            name: ({ event }) => event.name,
            description: ({ event }) => event.description,
          }),
          reenter: true,
        },
        RUN: {
          target: "complete",
          actions: assign({
            outputs: ({ event }) => event.inputs,
          }),
        },
      },
    },
    complete: {},
  },
});

export class OutputNode extends BaseNode<typeof OutputNodeMachine> {
  constructor(di: DiContainer, data: NodeData<typeof OutputNodeMachine>) {
    super("OutputNode", di, data, OutputNodeMachine, {
      actions: {
        create_schema: assign({
          schema: ({ context }) => createJsonSchema(context.inputSockets),
        }),
      },
    });
    const state = this.actor.getSnapshot();
    this.addInput("trigger", new Input(triggerSocket, "trigger"));
    console.log("INITIAL", {
      name: state.context.name,
      description: state.context.description,
      sockets: state.context.inputSockets,
    });
    const inputGenerator = new SocketGeneratorControl({
      connectionType: "input",
      name: "Input Sockets",
      ignored: ["trigger"],
      tooltip: "Add Input sockets",
      initial: {
        name: state.context.name,
        description: state.context.description,
        sockets: state.context.inputSockets,
      },
      onChange: ({ sockets, name, description }) => {
        console.log("CHANGED", { sockets, name, description });
        this.actor.send({
          type: "CHANGE",
          name,
          description,
          inputSockets: sockets,
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
    const rawTemplate = state.context.inputSockets as JSONSocket[];

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
      this.addInput(item.name, new Input(socket, item.name, false));
    }
  }

  async serialize() {
    return {};
  }
}
