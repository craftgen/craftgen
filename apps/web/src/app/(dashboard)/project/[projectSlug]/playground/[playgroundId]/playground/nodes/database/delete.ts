import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";

const databaseDeleteMachine = createMachine({
  id: "databaseInsert",
});

export class DatabaseDelete extends BaseNode<
  typeof databaseDeleteMachine,
  {},
  {},
  {}
> {
  constructor(di: DiContainer, data: NodeData<typeof databaseDeleteMachine>) {
    super("DatabaseDelete", di, data, databaseDeleteMachine, {});
  }

  async invoke() {}

  async data() {}

  async serialize() {}
}
