import { createMachine, assign } from "xstate";
import { BaseNode, ParsedNode } from "../base";
import { DiContainer } from "../../types";
import { triggerSocket } from "../../sockets";
import {
  JSONSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { Input } from "../../input-output";
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
    };
    context: {
      name: string;
      description: string;
      inputSockets: JSONSocket[];
      inputs: Record<string, any>;
      outputs: Record<string, any>;
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
}
