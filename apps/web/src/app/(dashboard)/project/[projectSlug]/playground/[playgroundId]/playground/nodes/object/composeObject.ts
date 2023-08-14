import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";

const composeObjectMachine = createMachine({
  id: "composeObject",
});

export class ComposeObject extends BaseNode<
  typeof composeObjectMachine,
  {
    
  },
  {},
  {}
> {
  constructor(di: DiContainer, data: NodeData<typeof composeObjectMachine>) {
    super("Componse Object", di, data, composeObjectMachine, {});
  }
}
