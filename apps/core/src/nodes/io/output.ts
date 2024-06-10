import type { SetOptional } from "type-fest";
import { createMachine } from "xstate";

import type { JSONSocket } from "../../controls/socket-generator";
import type { DiContainer } from "../../types";
import {
  BaseNode,
  NodeContextFactory,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "../base";

const NodeOutputMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "NodeOutput",
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "Ollama Model",
      description: "Ollama Model configuration",
      inputSockets: {},
      outputSockets: {},
    }),
  types: {} as BaseMachineTypes<{
    input: {
      name: string;
      description: string;
    };
    context: {
      name: string;
      description: string;
    };
    actions: None;
    actors: None;
    events: {
      type: "CHANGE";
      name: string;
      description: string;
      inputSockets: Record<string, JSONSocket>;
    };
  }>,
  initial: "idle",
  states: {
    idle: {},
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
    },
  },
});

export type NodeOutputData = ParsedNode<"NodeOutput", typeof NodeOutputMachine>;

export class NodeOutput extends BaseNode<typeof NodeOutputMachine> {
  static nodeType = "NodeOutput" as const;
  static label = "Output";
  static description = "Node for handling outputs";
  static icon = "output";

  static parse(params: SetOptional<NodeOutputData, "type">): NodeOutputData {
    return {
      ...params,
      type: "NodeOutput",
    };
  }

  static machines = {
    NodeOutput: NodeOutputMachine,
  };

  constructor(di: DiContainer, data: NodeOutputData) {
    super("NodeOutput", di, data, NodeOutputMachine, {});
    this.setup();
  }
}
