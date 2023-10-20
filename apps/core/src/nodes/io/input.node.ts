import { assign, createMachine } from "xstate";
import { BaseNode, type NodeData } from "../base";
import { type DiContainer } from "../../types";
import {
  getControlBySocket,
  getSocketByJsonSchemaType,
  triggerSocket,
} from "../../sockets";
import { createJsonSchema } from "../../utils";
import {
  type JSONSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { merge } from "lodash-es";
import { Input, Output } from "../../input-output";

export const InputNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "InputNode",
  context: ({ input }) =>
    merge(
      {
        name: "Default",
        description: "",
        inputs: {},
        outputs: {},
        outputSockets: [],
        schema: {},
      },
      input
    ),
  types: {} as {
    input: {
      name: string;
      description: string;
      inputs: Record<string, any>;
      outputs: Record<string, any>;
      outputSockets: JSONSocket[];
      schema: any;
    };
    context: {
      name: string;
      description: string;
      inputs: Record<string, any>;
      outputs: Record<string, any>;
      outputSockets: JSONSocket[];
      schema: Record<string, any>;
    };
    events:
      | {
          type: "CHANGE";
          name: string;
          description: string;
          outputSockets: JSONSocket[];
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
            inputs: ({ context, event }) => {
              Object.keys(context.inputs).forEach((key) => {
                if (!context.outputSockets.find((i) => i.name === key)) {
                  delete context.inputs[key];
                }
              });
              return {
                ...context.inputs,
                ...event.values,
              };
            },
            outputs: ({ context, event }) => {
              Object.keys(context.outputs).forEach((key) => {
                if (!context.outputSockets.find((i) => i.name === key)) {
                  delete context.outputs[key];
                }
              });
              return {
                ...context.outputs,
                ...event.values,
              };
            },
          }),
        },
        CHANGE: {
          target: "idle",
          actions: assign({
            outputSockets: ({ event }) => event.outputSockets,
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
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
    },
  },
  output: ({ context }) => context.outputs,
});

export class InputNode extends BaseNode<typeof InputNodeMachine> {
  constructor(di: DiContainer, data: NodeData<typeof InputNodeMachine>) {
    super("InputNode", di, data, InputNodeMachine, {
      actions: {
        create_schema: assign({
          schema: ({ context }) => createJsonSchema(context.outputSockets),
        }),
      },
    });
    const state = this.actor.getSnapshot();
    this.addOutput("trigger", new Output(triggerSocket, "trigger"));
    const outputGenerator = new SocketGeneratorControl({
      connectionType: "output",
      name: "Output Sockets",
      ignored: ["trigger"],
      tooltip: "Add Output sockets",
      initial: {
        name: state.context.name,
        description: state.context.description,
        sockets: state.context.outputSockets,
      },
      onChange: ({ sockets, name, description }) => {
        this.actor.send({
          type: "CHANGE",
          name,
          description,
          outputSockets: sockets,
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
    const rawTemplate = state.context.outputSockets as JSONSocket[];

    for (const item of Object.keys(this.outputs)) {
      if (item === "trigger") continue; // don't remove the trigger socket
      if (rawTemplate.find((i: JSONSocket) => i.name === item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      this.removeOutput(item);
    }

    for (const input of Object.keys(this.inputs)) {
      if (input === "trigger") continue; // don't remove the trigger socket
      if (rawTemplate.find((i: JSONSocket) => i.name === input)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.source === this.id && c.sourceOutput === input);
      if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      this.removeInput(input);
    }

    for (const item of rawTemplate) {
      if (this.hasOutput(item.name)) {
        const output = this.outputs[item.name];
        if (output) {
          output.socket = getSocketByJsonSchemaType(item.type)!;
        }
        continue;
      }
      if (this.hasInput(item.name)) {
        const input = this.inputs[item.name];
        if (input) {
          input.socket = getSocketByJsonSchemaType(item.type)!;
        }
        continue;
      }
      const socket = getSocketByJsonSchemaType(item.type)!;

      const input = new Input(socket, item.name, true, false);
      const controller = getControlBySocket(
        socket,
        state.context.outputs[item.name],
        (v) => {
          this.actor.send({
            type: "SET_VALUE",
            values: {
              [item.name]: v,
            },
          });
        }
      );
      input.addControl(controller);
      this.addInput(item.name, input);
      if (!state.context.inputs[item.name]) {
        this.actor.send({
          type: "SET_VALUE",
          values: {
            [item.name]: "",
          },
        });
      }

      const output = new Output(socket, item.name, true);
      this.addOutput(item.name, output);
    }
  }

  async serialize() {
    return {};
  }
}
