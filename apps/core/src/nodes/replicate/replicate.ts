import { merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { createMachine, fromPromise, PromiseActorLogic } from "xstate";

import { type DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, type ParsedNode } from "../base";

const replicateMachine = createMachine({
  id: "replicate",
  initial: "idle",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        settings: {
          model_name: "",
          owner: "",
          version_id: "",
        },
        inputs: {},
        inputSockets: [],
        outputs: {},
        outputSockets: [],
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      settings?: {
        model_name: string;
        owner: string;
        version_id: string;
      };
    };
    context: {
      settings: {
        model_name: string;
        owner: string;
        version_id: string;
      };
    };
    actions: any;
    actors: {
      src: "getModelVersion";
      logic: PromiseActorLogic<any, any>;
    };
    events: any;
  }>,
  states: {
    idle: {
      invoke: {
        src: "getModelVersion",
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
  static icon = "replicate";

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
          async () => null,
        ),
      },
    });
  }
}
