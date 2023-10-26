import { createMachine, fromPromise } from "xstate";
import { BaseNode, type NodeData } from "../base";
import { type DiContainer } from "../../types";

const replicateMachine = createMachine({
  id: "replicate",
  initial: "idle",
  states: {
    idle: {
      invoke: {
        src: "getModelVersion",
        onDone: {
          actions: ({ context, event }) => console.log(event),
        },
      },
    },
    running: {},
    success: {},
    failure: {},
  },
});

export class Replicate extends BaseNode<typeof replicateMachine> {
  constructor(di: DiContainer, data: NodeData<typeof replicateMachine>) {
    super("Replicate", di, data, replicateMachine, {
      actors: {
        getModelVersion: fromPromise(
          // async () => await getModelVersion({ model_name, owner, version_id })
          async () => null
        ),
      },
    });
  }

  async execute() {}

  async data() {
    return {};
  }
}
