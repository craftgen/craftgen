import { curry, merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise, PromiseActorLogic } from "xstate";

import { RouterInputs, RouterOutputs } from "@seocraft/api";

import { JSONSocket } from "../../controls/socket-generator";
import { type DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, None, type ParsedNode } from "../base";

const replicateMachine = createMachine({
  id: "replicate",
  initial: "init",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        settings: {
          model: {
            model_name: "",
            owner: "",
            version_id: "",
          },
          run: null,
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
        model: {
          model_name: string;
          owner: string;
          version_id: string;
        };
        run: any;
      };
    };
    context: {
      settings: {
        model: {
          model_name: string;
          owner: string;
          version_id: string;
        };
        run: any;
      };
    };
    actions: None;
    events: None;
    actors:
      | {
          src: "getModelVersion";
          logic: PromiseActorLogic<
            RouterOutputs["replicate"]["getModelVersion"],
            RouterInputs["replicate"]["getModelVersion"]
          >;
        }
      | {
          src: "predictCreate";
          logic: PromiseActorLogic<
            RouterOutputs["replicate"]["predict"]["create"],
            RouterInputs["replicate"]["predict"]["create"]
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
        input: ({ context }): RouterInputs["replicate"]["getModelVersion"] =>
          context.settings.model,
        onDone: {
          target: "idle",
          actions: [
            assign({
              outputSockets: ({ event }) => {
                const Output = (event.output.openapi_schema as any).components
                  .schemas.Output;

                return {};
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
        RUN: {
          target: "running",
          actions: ["setValue"],
        },
      },
    },
    running: {
      initial: "trigger",
      states: {
        determineState: {
          always: [{}],
        },
        trigger: {
          invoke: {
            src: "predict",
            input: ({ context }) => ({
              identifier: context.settings.model,
              input: context.inputs,
            }),
            onError: {
              target: "#replicate.error",
              actions: [
                assign({
                  error: ({ event }) => {
                    console.log("event", event);
                    return event.data as any;
                  },
                }),
              ],
            },
            onDone: {
              target: "#replicate.complete",
              actions: [
                assign({
                  outputs: ({ event }) => {
                    console.log("event", event);
                    return {
                      result: event.output,
                    };
                  },
                }),
              ],
            },
          },
        },
        waiting: {},
      },
    },
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
        predictCreate: fromPromise(async ({ input }) => {
          return await di.api.trpc.replicate.predict.create.mutate(input);
        }),
      },
    });
    if (
      data.context?.settings?.model.model_name &&
      data.context?.settings.model.owner
    ) {
      if (this.label === "Replicate") {
        this.setLabel(
          `${data.context?.settings.model.model_name}/${data.context?.settings.model.owner}`,
        );
      }
    }
  }
}
