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

export const NodeInputMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGlgBcBDAJ0IDkcx8QAHLWAS0Kaw1oA9EBGAJnQBPXn2RjkQA */
  id: "NodeInput",
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
    guards: None;
    actions: None;
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
    actors: None;
  }>,
  initial: "idle",
  states: {
    idle: {},
  },
});

export type NodeInputData = ParsedNode<"NodeInput", typeof NodeInputMachine>;

export class NodeInput extends BaseNode<typeof NodeInputMachine> {
  static nodeType = "NodeInput" as const;
  static label = "Input";
  static description = "Node for handling inputs";
  static icon = "input";

  static parse(params: SetOptional<NodeInputData, "type">): NodeInputData {
    return {
      ...params,
      type: "NodeInput",
    };
  }

  static machines = {
    NodeInput: NodeInputMachine,
  };

  constructor(di: DiContainer, data: NodeInputData) {
    super("NodeInput", di, data, NodeInputMachine, {});
  }
}
