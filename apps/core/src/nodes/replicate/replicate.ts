import { createMachine, fromPromise } from "xstate";
import { BaseNode, type NodeData } from "../base";
import { type DiContainer } from "../../types";
import { getModelVersion } from "./replicate.actions";

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
const owner = "stability-ai";
const model_name = "sdxl";
const version_id =
  "1bfb924045802467cf8869d96b231a12e6aa994abfe37e337c63a4e49a8c6c41";

export class Replicate extends BaseNode<typeof replicateMachine> {
  constructor(di: DiContainer, data: NodeData<typeof replicateMachine>) {
    super("Replicate", di, data, replicateMachine, {
      actors: {
        getModelVersion: fromPromise(
          async () => await getModelVersion({ model_name, owner, version_id })
        ),
      },
    });
  }

  async execute() {}

  async data() {
    return {};
  }

  serialize() {
    return {};
  }
}
