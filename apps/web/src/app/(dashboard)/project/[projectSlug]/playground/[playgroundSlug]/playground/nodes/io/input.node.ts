import { assign, createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { ClassicPreset } from "rete";
import { getSocketByJsonSchemaType, triggerSocket } from "../../sockets";
import { createJsonSchema } from "../../utils";
import {
  JSONSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { merge } from "lodash-es";
import { getControlBySocket } from "../../control";

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
          target: "complete",
          actions: assign({
            outputs: ({ event }) => event.values,
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
      output: ({ context }) => ({
        outputs: context.outputs,
      }),
    },
  },
});

export class Input extends BaseNode<typeof InputNodeMachine> {
  constructor(di: DiContainer, data: NodeData<typeof InputNodeMachine>) {
    super("Input", di, data, InputNodeMachine, {
      actions: {
        create_schema: assign({
          schema: ({ context }) => createJsonSchema(context.outputSockets),
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

    for (const item of rawTemplate) {
      if (this.hasOutput(item.name)) {
        const output = this.outputs[item.name];
        if (output) {
          output.socket = getSocketByJsonSchemaType(item.type)!;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item.type)!;
      const output = new ClassicPreset.Output(socket, item.name, true);
      this.addOutput(item.name, output);
    }
  }

  async serialize() {
    return {};
  }
}
