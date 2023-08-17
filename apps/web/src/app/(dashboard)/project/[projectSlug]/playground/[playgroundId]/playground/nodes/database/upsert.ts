import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";

const databaseUpsertMachine = createMachine({
  id: "databaseInsert",
});

export class DatabaseUpsert extends BaseNode<
  typeof databaseUpsertMachine,
  {},
  {},
  {}
> {
  constructor(di: DiContainer, data: NodeData<typeof databaseUpsertMachine>) {
    super("DatabaseUpsert", di, data, databaseUpsertMachine, {});
  }

  async execute() {}

  async data() {}

  async serialize() {}
}
