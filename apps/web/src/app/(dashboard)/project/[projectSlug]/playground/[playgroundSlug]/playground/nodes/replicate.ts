import { createMachine } from "xstate";
import { BaseNode, NodeData } from "./base";
import { DiContainer } from "../editor";

const replicateMachine = createMachine({
  id: "replicate",
});

export class Replicate extends BaseNode<typeof replicateMachine> {
  constructor(di: DiContainer, data: NodeData<typeof replicateMachine>) {
    super("Replicate", di, data, replicateMachine, {});
  }

  async execute() {}

  async data() {
    return {};
  }

  serialize() {
    return {};
  }
}
