import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";

const databaseUpdateMachine = createMachine({
  id: "databaseInsert",
});

export class DatabaseUpdate extends BaseNode<
  typeof databaseUpdateMachine,
  {},
  {},
  {}
> {
  constructor(di: DiContainer, data: NodeData<typeof databaseUpdateMachine>) {
    super("DatabaseUpdate", "Update", di, data, databaseUpdateMachine, {});
  }

  async execute() {}

  async data() {}

  async serialize() {}
}
