import { isNil, merge } from "lodash-es";
import { match, P } from "ts-pattern";
import type { SetOptional } from "type-fest";
import type {
  PromiseActorLogic} from "xstate";
import {
  assign,
  createMachine,
  enqueueActions,
  fromPromise
} from "xstate";

import type { RouterInputs, RouterOutputs } from "@seocraft/api";

import type { JSONSocket } from "../../controls/socket-generator";
import { generateSocket } from "../../controls/socket-generator";
import type {DiContainer} from "../../types";
import type { BaseMachineTypes, None} from "../base";
import { BaseNode  } from "../base";
import type {ParsedNode} from "../base";

const inputSockets = {
  RUN: generateSocket({
    type: "trigger",
    name: "Run",
    isMultiple: false,
    required: true,
    "x-key": "RUN",
    "x-event": "RUN",
    "x-showSocket": true,
  }),
} as const;

const outputSockets = {
  onDone: generateSocket({
    type: "trigger",
    name: "On Done",
    isMultiple: false,
    required: true,
    "x-showSocket": true,
    "x-key": "onDone",
    "x-event": "RUN",
  }),
};

const replicateMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwAcA2BLAxgQwBcwA6LAOywIGIIB7Mk8gN1oGsTVNdDGKCFmtfASz0A2gAYAupKmJQaWrEqiy8kAA9EAJgAc24voBsugMxGA7JdMWArEdsAaEAE9EARgCcnw9pvv9W20LCwAWfQBfCOdObGFeSioAZQBRABUAfQA1AEEAGQBVFNl1RWURenUtBHdtIwNTAO8jCTMJC31nNxr3CUNTU3tdTxDQ0aiY9DieUggMMGT07PyikqQQMpVK9er3Sx89C1MJT3r3d1DtLo9Q92JQ09DTW8CLP1MJkFjuIln5qgASgUAHJrBRKLZqHaIIyNYgSPaeUKhEzmc5XVyIXR3UzabSedy2PbuUxmYafb7xYjIACuZAoZCgxAgYCIyAAtuQwEkCDwqGCNhCKlDQNUjJ5dMRtO4wrYJNLgo9rjUEaFiEYHINQrYUY0nhSpj8OHSGUyWWzOQweXyxO45OtNsKqjCJVKZdr5bULErMQhPANiETjhdsW1cQauFTafTyGbWWAOVzrUR+dp7eDyqpnTUnrYpWEjg4JHLWkZlednuqznY9VqPtEvoaoybY8z44mrbyU2JTOnBZntqKXZLpbLPYqjKFlboierWt6Wtog9oI9NftHTW2LUmuwsxKE+46s9CEOKR+65QqF1PfUZasRzp4-JOkdqLKujdSW4ziARkFgoBgZAaHoXgWHYakmxmDdWz-ACgIEMgWGEVRZAFI9B00RBGlMeFdDecwJXaJdPCcX19EleUngeUkLEJCQjA-ZsYx-ODAITKgE2QWhkGITBCAAMx49lIMjaDvyZNiEMEFDxGkdChWPIcc0GfMxnMOUS10MtfRJOV1TsGUKysUkmPElimRwAALMAcFYWMQIYUgkLYDgoPXCTiGs2z7MZRDkMIVD5OkUpFMw3YEQOCUZV0WLvCCDFugsdpDHw7UlyCUIJEGMyPIs4hYF5ZAREZKgNEKmY8AEtkAApegkCQAEoqEpczNwq4rYwUgcRSwlUvClaKOji0i8XLVUq1sLUdVhC560mMS8s3NBuJwOBlFK8rd2IKrauOJqWvc418pWoR1q6kKHTC3qIoG-FsWG4ZRsSxB-QMKxeh1DonjozxcuO9qaRwNbIEgflLozSFszmvNgnUostJ07pah1B8dXiiQ3xaUJ-uILieMWTJckKYoIf7KGTyCctbDse4Hm0cI7wRLxGIbVrfnx4CgVBMmMJumEXpzXQ+gvfEdXOHVbCiBsyFoFl4HWdmwFCnrswAWncZU1aMeEGr1-W9bo3HyEoFWKeUsZlWlO5ego4WUWRJd3zZo6-mVq7VcpgaLiJU47GlXELCt25iBCCXcSJKa3mdha1wB2MzadE8HmVBLQ-OI5bGGGmQl0XGYJ-c0E0tbld0TpS+rlHXtUaJcxjefFpwee49gZjpTCffQY8bRb49Y-92OQcvwteoPyKyqVpWREkGNsf1Wdjz8C8smy7ITj3zb62psvuJ3s41aURmVN4fHFZE5RGScZyll3e6-fKOpKqBh-5hBYruYbbnxFoTM8caSWIAMOorR2iWGRH9W+cd77LVWudRkL9szaT6IMQ4rQJTDEFp4Vo8ISRHAatKdoYR86eVgEDEGLIIAIJPLUDUODxR4hGOcWKphyxLgMPoPwYtwH1Hmj3KBy9iACTwFgeYlCN5J2UkgwBQR8JoLioLXQzdMoykxlgrKDNiH5XwGQNaoiqGSJaNI1Bwx5HKiZvCZ4TNSIjGCAvPhn4cC0HZJgeM+it5zwsC3BENMvDnExoLWo956GEiXGePSuNOZuN2PUTxxw55YNGJjMI1MGqBksL0f0vR8QjGlhEIAA */
  id: "replicate",
  initial: "init",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        settings: {
          loaded: false,
          model: {
            model_name: "",
            owner: "",
            version_id: "",
          },
          run: null,
        },
        inputs: {},
        inputSockets: {
          ...inputSockets, // Otherwise this causes a closure error.
        },
        outputs: {},
        outputSockets: {
          ...outputSockets, // Otherwise this causes a closure error.
        },
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      settings?: {
        loaded: boolean;
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
        loaded: boolean;
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
    guards: None;
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
        }
      | {
          src: "predictGet";
          logic: PromiseActorLogic<
            RouterOutputs["replicate"]["predict"]["get"],
            RouterInputs["replicate"]["predict"]["get"]
          >;
        };
  }>,
  states: {
    load: {
      invoke: {
        src: "getModelVersion",
        input: ({ context }): RouterInputs["replicate"]["getModelVersion"] => ({
          model_name: context.settings.model.model_name,
          owner: context.settings.model.owner,
          version_id: context.settings.model.version_id,
        }),
        onDone: {
          target: "idle",
          actions: [
            assign({
              outputSockets: ({ event }) => {
                const Output = (event.output.openapi_schema ).components
                  .schemas.Output;
                return match(Output).otherwise(() => {
                  return {
                    onDone: outputSockets.onDone,
                    result: {
                      ...Output,
                      name: "result",
                      isMultiple: true,
                      required: true,
                      default: [],
                      "x-key": "result",
                      "x-showSocket": true,
                    },
                  };
                });
              },
              settings: ({ event, context }) => {
                console.log("event", event);
                const { id, ...rest } = event.output;
                return {
                  ...context.settings,
                  loaded: true,
                  model: {
                    ...context.settings.model,
                    ...rest,
                  },
                };
              },
              inputSockets: ({ event }) => {
                const Input = event.output.schema.definitions.Input;
                const keys = Object.entries(Input.properties);
                const modelSockets = keys
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
                    const required = (Input?.required || []).includes(key);
                    return {
                      ...value,
                      name: value.title ?? key,
                      type: value.type
                        ? value.type
                        : value.allOf[0].enum
                        ? value.allOf[0].type
                        : "unknown",
                      isMultiple: false,
                      required,
                      "x-key": key,
                      // "x-controller": isEnum && "select",
                      // "x-showSocket": isNil(value.default) && required,
                      "x-controller": true,
                      "x-showSocket": true 
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
                return {
                  ...inputSockets,
                  ...modelSockets,
                };
              },
            }),
          ],
        },
      },
    },
    init: {
      always: [
        {
          guard: ({ context }) => context.settings.loaded,
          target: "idle",
        },
        {
          guard: ({ context }) => !context.settings.loaded,
          target: "load",
        },
      ],
      on: {
        SET_VALUE: {
          actions: ["setValue"],
        },
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
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
        },
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
      },
    },
    running: {
      initial: "trigger",
      states: {
        determineState: {
          always: [
            {
              guard: ({ context }) => {
                return context.settings.run?.status === "starting";
              },
              target: "starting",
            },
            {
              guard: ({ context }) => {
                return context.settings.run?.status === "processing";
              },
              target: "processing",
            },
            {
              guard: ({ context }) => {
                return context.settings.run?.status === "succeeded";
              },
              target: "succeeded",
            },
            {
              guard: ({ context }) => {
                return context.settings.run?.status === "failed";
              },
              target: "#replicate.running.failed",
            },
            {
              guard: ({ context }) => {
                return context.settings.run?.status === "canceled";
              },
              target: "#replicate.running.canceled",
            },
          ],
        },
        trigger: {
          invoke: {
            src: "predictCreate",
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
              target: "#replicate.running.determineState",
              actions: [
                assign({
                  settings: ({ event, context }) => {
                    return {
                      ...context.settings,
                      run: event.output,
                    };
                  },
                }),
              ],
            },
          },
        },
        checking: {
          invoke: {
            src: "predictGet",
            input: ({ context }) => ({
              prediction_id: context.settings.run?.id,
            }),
            onDone: {
              target: "#replicate.running.determineState",
              actions: [
                assign({
                  settings: ({ event, context }) => {
                    return {
                      ...context.settings,
                      run: event.output,
                    };
                  },
                }),
              ],
            },
          },
        },
        starting: {
          after: {
            1000: "checking",
          },
        },
        processing: {
          entry: assign({
            outputs: ({ context }) => {
              const result = match(context.outputSockets.result)
                .with(
                  {
                    type: "array",
                    items: { type: "string" },
                    title: "Output",
                    "x-cog-array-type": "iterator",
                    "x-cog-array-display": "concatenate",
                  },
                  () => {
                    return context.settings.run.output.join("");
                  },
                )
                .otherwise(() => {
                  return context.settings.run.output;
                });
              return {
                result,
              };
            },
          }),
          after: {
            300: "checking",
          },
        },
        succeeded: {
          entry: assign({
            outputs: ({ context }) => {
              console.log("context", context);
              const result = match(context.outputSockets.result)
                .with(
                  {
                    type: "array",
                    items: { type: "string" },
                    title: "Output",
                    "x-cog-array-type": "iterator",
                    "x-cog-array-display": "concatenate",
                  },
                  () => {
                    return context.settings.run.output.join("");
                  },
                )
                .otherwise((output) => {
                  return context.settings.run.output;
                });
              return {
                result,
              };
            },
          }),
          always: "#replicate.complete",
        },
        failed: {},
        canceled: {},
      },
    },
    complete: {
      type: "final",
      entry: enqueueActions(({ enqueue }) => {
        enqueue({
          type: "triggerSuccessors",
          params: {
            port: "onDone",
          },
        });
      }),
    },
    error: {
      on: {
        SET_VALUE: {
          actions: ["setValue"],
          target: "idle",
        },
        RUN: {
          target: "running",
          actions: ["setValue"],
        },
      },
    },
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
        predictGet: fromPromise(async ({ input }) => {
          return await di.api.trpc.replicate.predict.get.query(input);
        }),
      },
    });

    // this.updateLabel();
    this.setup();

    // this.addInput("trigger", new Input(triggerSocket, "Exec", true));
    // this.addOutput("trigger", new Output(triggerSocket, "Exec"));
  }

  private updateLabel() {
    if (
      this.nodeData.context?.settings?.model.model_name &&
      this.nodeData.context?.settings.model.owner
    ) {
      if (this.label === "Replicate") {
        this.setLabel(
          `${this.nodeData.context?.settings.model.model_name}/${this.nodeData.context?.settings.model.owner}`,
        );
      }
    }
  }
}
