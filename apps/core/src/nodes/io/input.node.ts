import { merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import {
  SocketGeneratorControl,
  type JSONSocket,
} from "../../controls/socket-generator";
import { Input, Output } from "../../input-output";
import {
  getControlBySocket,
  getSocketByJsonSchemaType,
  triggerSocket,
} from "../../sockets";
import { type DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../base";

export const InputNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "InputNode",
  context: ({ input }) =>
    merge(
      {
        name: "Default",
        description: "",
        inputs: {},
        inputSockets: {},
        outputs: {},
        outputSockets: {},
        error: null,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      name: string;
      description: string;
    };
    actions: any;
    context: {
      name: string;
      description: string;
    };
    events: {
      type: "CHANGE";
      name: string;
      description: string;
      outputSockets: Record<string, JSONSocket>;
    };
    actors: any;
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        SET_VALUE: {
          actions: ["setValue"],
        },
        CHANGE: {
          target: "idle",
          actions: assign({
            outputSockets: ({ event }) => event.outputSockets,
            inputSockets: ({ event }) => event.outputSockets,
            name: ({ event }) => event.name,
            description: ({ event }) => event.description,
          }),
          reenter: true,
        },
        RUN: {
          target: "complete",
          actions: assign({
            outputs: ({ event }) => event.values,
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

export type InputNodeData = ParsedNode<"InputNode", typeof InputNodeMachine>;

export class InputNode extends BaseNode<typeof InputNodeMachine> {
  static nodeType = "InputNode" as const;
  static label = "Input";
  static description = "Node for handling inputs";
  static icon = "input";

  static parse(params: SetOptional<InputNodeData, "type">): InputNodeData {
    return {
      ...params,
      type: "InputNode",
    };
  }

  constructor(di: DiContainer, data: InputNodeData) {
    super("InputNode", di, data, InputNodeMachine, {});
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
        sockets: Object.values(state.context.outputSockets),
      },
      onChange: ({ sockets, name, description }) => {
        const outputSockets = sockets.reduce(
          (acc, socket) => {
            acc[socket.name] = socket;
            return acc;
          },
          {} as Record<string, JSONSocket>,
        );
        this.actor.send({
          type: "CHANGE",
          name,
          description: description || "",
          outputSockets,
        });
      },
    });
    this.addControl("outputGenerator", outputGenerator);
  }

  async updateInputs(rawTemplate: Record<string, JSONSocket>) {
    const state = this.actor.getSnapshot();
    for (const item of Object.keys(this.inputs)) {
      if (item === "trigger") continue; // don't remove the trigger socket
      if (rawTemplate[item]) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      // if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      if (connections.length >= 1) {
        for (const c of connections) {
          await this.di.editor.removeConnection(c.id);
          this.di.editor.addConnection({
            ...c,
            target: this.id,
            targetInput: item,
          });
        }
      }
      this.removeInput(item);
    }

    for (const [key, item] of Object.entries(rawTemplate)) {
      if (this.hasInput(item.name)) {
        const input = this.inputs[key];
        if (input) {
          input.socket = getSocketByJsonSchemaType(item)! as any;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item)!;
      const input = new Input(socket, item.name, true, false);
      const controller = getControlBySocket(
        socket,
        () => this.snap.context.outputs[item.name],
        (v) => {
          this.actor.send({
            type: "SET_VALUE",
            values: {
              [item.name]: v,
            },
          });
        },
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
    }
  }
}
