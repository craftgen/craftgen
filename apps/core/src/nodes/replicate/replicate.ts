import { createMachine, fromPromise } from "xstate";
import { BaseNode, ParsedNode, type NodeData } from "../base";
import { type DiContainer } from "../../types";
import { SetOptional } from "type-fest";

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

export type ReplicateData = ParsedNode<"Replicate", typeof replicateMachine>;

export class Replicate extends BaseNode<typeof replicateMachine> {
  static nodeType = "Replicate";
  static label = "Replicate";
  static description = "For using Replicate API";
  static icon = "box-select";

  static parse(params: SetOptional<ReplicateData, "type">): ReplicateData {
    return {
      ...params,
      type: "Replicate",
    };
  }

  constructor(di: DiContainer, data: ReplicateData) {
    super("Replicate", di, data, replicateMachine, {
      actors: {
        getModelVersion: fromPromise(
          // async () => await getModelVersion({ model_name, owner, version_id })
          async () => null
        ),
      },
    });
  }
}
