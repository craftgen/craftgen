import { curry, merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise, PromiseActorLogic } from "xstate";

import { RouterInputs, RouterOutputs } from "@seocraft/api";

import { JSONSocket } from "../../controls/socket-generator";
import { type DiContainer } from "../../types";
import { convertOpenAPIToJSONSchema } from "../../utils";
import { BaseMachineTypes, BaseNode, None, type ParsedNode } from "../base";

const replicateMachine = createMachine({
  id: "replicate",
  initial: "init",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        settings: {
          model_name: "",
          owner: "",
          version_id: "",
        },
        inputs: {},
        inputSockets: {},
        outputs: {},
        outputSockets: {},
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
    actions: None;
    events: None;
    actors: {
      src: "getModelVersion";
      logic: PromiseActorLogic<
        RouterOutputs["replicate"]["getModelVersion"],
        RouterInputs["replicate"]["getModelVersion"]
      >;
    };
  }>,
  states: {
    init: {
      on: {
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
      invoke: {
        src: "getModelVersion",
        input: ({ context }): RouterInputs["replicate"]["getModelVersion"] => ({
          owner: context.settings.owner,
          model_name: context.settings.model_name,
          version_id: context.settings.version_id,
        }),
        onDone: {
          target: "idle",
          actions: [
            assign({
              outputSockets: ({ event }) => {
                const Output = (event.output.openapi_schema as any).components
                  .schemas.Output;
                // const keys = Object.entries(Output.properties);

                return {};
                return keys
                  .map(([key, value]: [key: string, value: any]) => ({
                    name: value.title ?? key,
                    type: value.type,
                    isMultiple: false,
                    required: true,
                    description: value.description,
                    default: value.default,
                    "x-key": key,
                    "x-order": value["x-order"],
                  }))
                  .sort((a, b) => a["x-order"] - b["x-order"])
                  .reduce(
                    (acc, cur) => {
                      acc[cur["x-key"]] = cur;
                      return acc;
                    },
                    {} as Record<string, JSONSocket>,
                  );
              },
              inputSockets: ({ event }) => {
                const Input = event.output.schema.definitions.Input;
                console.log("Input", Input);
                // const Input = (event.output.openapi_schema as any).components
                //   .schemas.Input;
                const keys = Object.entries(Input.properties);
                return keys
                  .map(([key, value]: [key: string, value: any]) => {
                    let type;
                    let isEnum = false;
                    if (!value.type) {
                      if (value.allOf) {
                        type = value.allOf[0].type;
                        isEnum = true;
                      } else if (value.oneOf) {
                        type = value.oneOf[0].type;
                        isEnum = true;
                      } else {
                        type = "unknown";
                      }
                    }

                    return {
                      ...value,
                      name: value.title ?? key,
                      type: value.type
                        ? value.type
                        : value["allOf"][0]["enum"]
                        ? value.allOf[0].type
                        : "unknown",
                      isMultiple: false,
                      required: (Input?.required || []).includes(key),
                      "x-key": key,
                      "x-controller": isEnum && "select",
                    };
                  })
                  .sort((a, b) => a["x-order"] - b["x-order"])
                  .reduce(
                    (acc, cur) => {
                      acc[cur["x-key"]] = cur;
                      return acc;
                    },
                    {} as Record<string, JSONSocket>,
                  );
              },
            }),
            assign({
              outputs: ({ event }) => {
                console.log("event", event);
              },
            }),
          ],
        },
      },
    },
    idle: {
      on: {
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
    running: {},
    complete: {},
    error: {},
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
        getModelVersion: fromPromise(async ({ input }) => {
          return await di.api.trpc.replicate.getModelVersion.query(input);
        }),
        predict: fromPromise(async ({ input }) => {
          return await di.api.trpc.replicate.predict.query(input);
        })
      },
    });
  }
}
