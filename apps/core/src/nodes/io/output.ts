import { createMachine, assign } from "xstate";
import { BaseNode, ParsedNode } from "../base";
import { DiContainer } from "../../types";
import { getSocketByJsonSchemaType, triggerSocket } from "../../sockets";
import {
  JSONSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { Input, Output } from "../../input-output";
import { merge } from "lodash-es";
import { SetOptional } from "type-fest";

const OutputNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "OutputNode",
  context: ({ input }) =>
    merge(
      {
        name: "Output",
        description: "",
        inputSockets: [],
        outputSockets: [],
        inputs: {},
        outputs: {},
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
      outputSockets: JSONSocket[];
    };
    context: {
      name: string;
      description: string;
      inputSockets: JSONSocket[];
      inputs: Record<string, any>;
      outputs: Record<string, any>;
      outputSockets: JSONSocket[];
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
            outputSockets: ({ event }) => event.inputSockets,
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

export type OutputNodeData = ParsedNode<"OutputNode", typeof OutputNodeMachine>;

export class OutputNode extends BaseNode<typeof OutputNodeMachine> {
  static nodeType = "OutputNode" as const;
  static label = "Output";
  static description = "Node for handling outputs";
  static icon = "output";

  static parse(params: SetOptional<OutputNodeData, "type">): OutputNodeData {
    return {
      ...params,
      type: "OutputNode",
    };
  }

  constructor(di: DiContainer, data: OutputNodeData) {
    super("OutputNode", di, data, OutputNodeMachine, {});
    const state = this.actor.getSnapshot();
    this.addInput("trigger", new Input(triggerSocket, "trigger"));
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
        this.actor.send({
          type: "CHANGE",
          name,
          description,
          inputSockets: sockets,
        });
      },
    });
    this.addControl("outputGenerator", inputGenerator);
    this.updateInputs(this.actor.getSnapshot().context.inputSockets);
  }

  async updateOutputs(rawTemplate: JSONSocket[]) {
    for (const item of Object.keys(this.outputs)) {
      if (item === "trigger") continue; // don't remove the trigger socket
      if (rawTemplate.find((i: JSONSocket) => i.name === item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.source === this.id && c.sourceOutput === item);
      // if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      if (connections.length >= 1) {
        for (const c of connections) {
          await this.di.editor.removeConnection(c.id);
          this.di.editor.addConnection({
            ...c,
            source: this.id,
            sourceOutput: item,
          });
        }
      }
      this.removeOutput(item);
    }

    for (const [index, item] of rawTemplate.entries()) {
      if (this.hasOutput(item.name)) {
        const output = this.outputs[item.name];
        if (output) {
          output.socket = getSocketByJsonSchemaType(item.type)! as any;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item.type)!;
      const output = new Output(socket, item.name, false, false) as any;
      output.index = index + 1;
      this.addOutput(item.name, output);
    }
  }
}
