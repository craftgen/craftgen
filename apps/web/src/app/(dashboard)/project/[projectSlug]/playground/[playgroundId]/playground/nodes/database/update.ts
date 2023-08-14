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
    super("DatabaseUpdate", di, data, databaseUpdateMachine, {});
  }

  async invoke() {}

  async data() {}

  async serialize() {}
}
