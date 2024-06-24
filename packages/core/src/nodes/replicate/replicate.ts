import { createId } from "@paralleldrive/cuid2";
import { isNil, merge } from "lodash-es";
import type { SetOptional } from "type-fest";
import {
  assign,
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
  type ActorRefFrom,
  type PromiseActorLogic,
} from "xstate";

import type { RouterInputs, RouterOutputs } from "@craftgen/api";

import {
  generateSocket,
  type JSONSocket,
} from "../../controls/socket-generator";
import { Editor } from "../../editor";
import { spawnInputSockets } from "../../input-socket";
import { spawnOutputSockets } from "../../output-socket";
import type { DiContainer } from "../../types";
import {
  BaseNode,
  NodeContextFactory,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "../base";

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

const replicatePredicateMachine = setup({}).createMachine({
  initial: "trigger",
  context: ({ input }) => {
    return merge(
      {
        outputs: {
          result: undefined,
        },
      },
      input,
    );
  },
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
          target: "failed",
        },
        {
          guard: ({ context }) => {
            return context.settings.run?.status === "canceled";
          },
          target: "canceled",
        },
      ],
    },
    trigger: {
      invoke: {
        src: "predictCreate",
        input: ({ context }) => ({
          identifier: {
            owner: context.settings.model.owner,
            model_name: context.settings.model.model_name,
            version_id: context.settings.model.version_id,
          },
          input: context.inputs,
        }),
        onError: {
          target: "failed",
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
          target: "determineState",
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
          target: "determineState",
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
          // const result = match(context.outputSockets.result)
          //   .with(
          //     {
          //       type: "array",
          //       items: { type: "string" },
          //       title: "Output",
          //       "x-cog-array-type": "iterator",
          //       "x-cog-array-display": "concatenate",
          //     },
          //     () => {
          //       return context.settings.run.output.join("");
          //     },
          //   )
          //   .otherwise(() => {
          //     return context.settings.run.output;
          //   });
          return {
            result: context.settings.run.output,
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
          // const result = match(context.outputSockets.result)
          //   .with(
          //     {
          //       type: "array",
          //       items: { type: "string" },
          //       title: "Output",
          //       "x-cog-array-type": "iterator",
          //       "x-cog-array-display": "concatenate",
          //     },
          //     () => {
          //       return context.settings.run.output.join("");
          //     },
          //   )
          //   .otherwise((output) => {
          //     return context.settings.run.output;
          //   });
          return {
            result: context.settings.run.output,
          };
        },
      }),
      always: "complete",
    },
    failed: {},
    canceled: {},
    complete: {
      type: "final",
      entry: enqueueActions(({ enqueue, context }) => {
        for (const sender of context.senders) {
          enqueue.sendTo(
            ({ system }) => system.get(sender.id),
            ({ context, self }) => ({
              type: "RESULT",
              params: {
                id: self.id,
                res: context.outputs,
              },
            }),
          );
        }
      }),
    },
  },
});

const replicateMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwAcA2BLAxgQwBcwA6LAOywIGIIB7Mk8gN1oGsTVNdDGKCFmtfASz0A2gAYAupKmJQaWrEqiy8kAA9EAJgAc24voBsugMxGA7JdMWArEdsAaEAE9EARgCcnw9pvv9W20LCwAWfQBfCOdObGFeSioAZQBRABUAfQA1AEEAGQBVFNl1RWURenUtBHdtIwNTAO8jCTMJC31nNxr3CUNTU3tdTxDQ0aiY9DieUggMMGT07PyikqQQMpVK9er3Sx89C1MJT3r3d1DtLo9Q92JQ09DTW8CLP1MJkFjuIln5qgASgUAHJrBRKLZqHaIIyNYgSPaeUKhEzmc5XVyIXR3UzabSedy2PbuUxmYafb7xYjIACuZAoZCgxAgYCIyAAtuQwEkCDwqGCNhCKlDQNUjJ5dMRtO4wrYJNLgo9rjUEaFiEYHINQrYUY0nhSpj8OHSGUyWWzOQweXyxO45OtNsKqjCJVKZdr5bULErMQhPANiETjhdsW1cQauFTafTyGbWWAOVzrUR+dp7eDyqpnTUnrYpWEjg4JHLWkZlednuqznY9VqPtEvoaoybY8z44mrbyU2JTOnBZntqKXZLpbLPYqjKFlboierWt6Wtog9oI9NftHTW2LUmuwsxKE+46s9CEOKR+65QqF1PfUZasRzp4-JOkdqLKujdSW4ziARkFgoBgZAaHoXgWHYakmxmDdWz-ACgIEMgWGEVRZAFI9B00RBGlMeFdDecwJXaJdPCcX19EleUngeUkLEJCQjA-ZsYx-ODAITKgE2QWhkGITBCAAMx49lIMjaDvyZNiEMEFDxGkdChWPIcc0GfMxnMOUS10MtfRJOV1TsGUKysUkmPElimRwAALMAcFYWMQIYUgkLYDgoPXCTiGs2z7MZRDkMIVD5OkUpFMw3YEQOCUZV0WLvCCDFugsdpDHw7UlyCUIJEGMyPIs4hYF5ZAREZKgNEKmY8AEtkAApegkCQAEoqEpczNwq4rYwUgcRSwlUvClaKOji0i8XLVUq1sLUdVhC560mMS8s3NBuJwOBlFK8rd2IKrauOJqWvc418pWoR1q6kKHTC3qIoG-FsWG4ZRsSxB-QMKxeh1DonjozxcuO9qaRwNbIEgflLozSFszmvNgnUostJ07pah1B8dXiiQ3xaUJ-uILieMWTJckKYoIf7KGTyCctbDse4Hm0cI7wRLxGIbVrfnx4CgVBMmMJumEXpzXQ+gvfEdXOHVbCiBsyFoFl4HWdmwFCnrswAWncZU1aMeEGr1-W9bo3HyEoFWKeUsZlWlO5ego4WUWRJd3zZo6-mVq7VcpgaLiJU47GlXELCt25iBCCXcSJKa3mdha1wB2MzadE8HmVBLQ-OI5bGGGmQl0XGYJ-c0E0tbld0TpS+rlHXtUaJcxjefFpwee49gZjpTCffQY8bRb49Y-92OQcvwteoPyKyqVpWREkGNsf1Wdjz8C8smy7ITj3zb62psvuJ3s41aURmVN4fHFZE5RGScZyll3e6-fKOpKqBh-5hBYruYbbnxFoTM8caSWIAMOorR2iWGRH9W+cd77LVWudRkL9szaT6IMQ4rQJTDEFp4Vo8ISRHAatKdoYR86eVgEDEGLIIAIJPLUDUODxR4hGOcWKphyxLgMPoPwYtwH1Hmj3KBy9iACTwFgeYlCN5J2UkgwBQR8JoLioLXQzdMoykxlgrKDNiH5XwGQNaoiqGSJaNI1Bwx5HKiZvCZ4TNSIjGCAvPhn4cC0HZJgeM+it5zwsC3BENMvDnExoLWo956GEiXGePSuNOZuN2PUTxxw55YNGJjMI1MGqBksL0f0vR8QjGlhEIAA */
  id: "replicate",
  initial: "init",
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: `${ctx.input.settings?.model.model_name}_${ctx.input.settings?.model.owner}`,
      description:
        ctx.input.settings?.model?.description ||
        "Replicate Model Configuration",
      inputSockets,
      outputSockets,
      settings: {
        loaded: false,
        model: {
          description: "",
          model_name: "",
          owner: "",
          version_id: "",
        },
        run: null,
      },
    }),
  types: {} as BaseMachineTypes<{
    input: {
      settings?: {
        loaded: boolean;
        model: {
          model_name: string;
          description: string;
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
          description: string;
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
  on: {
    ASSIGN_CHILD: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("assignChild");
      }),
    },
    INITIALIZE: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("initialize");
      }),
    },
    SET_VALUE: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("setValue");
      }),
    },
  },
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
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({
              settings: ({ event, context }) => {
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
            });
            enqueue.assign({
              inputSockets: ({ event, context, spawn, self }) => {
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
                      "x-showSocket": isNil(value.default) && required,
                      "x-controller": true,
                      // "x-showSocket": true,
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

                console.log("modelSockets", modelSockets);

                const spawnedModelSockets = spawnInputSockets({
                  spawn,
                  self,
                  inputSockets: modelSockets,
                });

                return {
                  ...context.inputSockets,
                  ...spawnedModelSockets,
                };
              },
            });
            enqueue.assign({
              outputSockets: ({ event, context, spawn, self }) => {
                const Output =
                  event.output.openapi_schema.components.schemas.Output;
                const spawnedModelSockets = spawnOutputSockets({
                  spawn,
                  self,
                  outputSockets: {
                    result: {
                      ...Output,
                      name: "result",
                      isMultiple: true,
                      required: true,
                      default: [],
                      "x-key": "result",
                      "x-showSocket": true,
                    },
                  },
                });
                return {
                  ...context.outputSockets,
                  ...spawnedModelSockets,
                };
              },
            });
          }),
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
      },
    },
    idle: {
      on: {
        RESULT: {
          actions: enqueueActions(({ enqueue, check, self, event }) => {
            enqueue.assign({
              outputs: ({ context, event }) => ({
                ...context.outputs,
                ...event.params?.res,
              }),
            });
            enqueue({
              type: "triggerSuccessors",
              params: {
                port: "onDone",
              },
            });
            enqueue("resolveOutputSockets");
          }),
        },
        RUN: {
          // target: "running",
          actions: enqueueActions(({ enqueue, event, check }) => {
            if (check(({ event }) => event.origin.type !== "compute-event")) {
              enqueue({
                type: "computeEvent",
                params: {
                  event: event.type,
                },
              });
              return;
            }
            enqueue({
              type: "removeComputation",
            });
            const runId = event.params.callId || `call_${createId()}`;
            enqueue.sendTo<ActorRefFrom<typeof replicatePredicateMachine>>(
              ({ system }) => system.get("editor"),
              ({ self, context }) => ({
                type: "SPAWN_RUN",
                params: {
                  id: runId,
                  parentId: self.id,
                  machineId: "NodeReplicate.run",
                  systemId: runId,
                  input: {
                    inputs: {
                      ...event.params.inputs,
                    },
                    settings: context.settings,
                    senders: [...event.params.senders],
                    parent: {
                      id: self.id,
                    },
                  },
                  syncSnapshot: true,
                },
              }),
            );
          }),
        },
      },
    },
    complete: {},
    error: {},
  },
});

export type ReplicateData = ParsedNode<
  "NodeReplicate",
  typeof replicateMachine
>;

export class NodeReplicate extends BaseNode<typeof replicateMachine> {
  static nodeType = "NodeReplicate";
  static label = "Replicate";
  static description = "For using Replicate API";
  static icon = "replicate";

  static parse(params: SetOptional<ReplicateData, "type">): ReplicateData {
    return {
      ...params,
      type: "NodeReplicate",
    };
  }

  static machines = {
    NodeReplicate: replicateMachine,
    "NodeReplicate.run": replicatePredicateMachine,
    "NodeReplicate.run:predictCreate": ({ di }: { di: Editor }) =>
      fromPromise(
        async ({
          input,
        }: {
          input: RouterInputs["replicate"]["predict"]["create"];
        }) => {
          return await di.api.trpc.replicate.predict.create.mutate(input);
        },
      ),
    "NodeReplicate.run:predictGet": ({ di }: { di: Editor }) =>
      fromPromise(
        async ({
          input,
        }: {
          input: RouterInputs["replicate"]["predict"]["get"];
        }) => {
          return await di.api.trpc.replicate.predict.get.query(input);
        },
      ),
    "NodeReplicate:getModelVersion": ({ di }: { di: Editor }) =>
      fromPromise(
        async ({
          input,
        }: {
          input: RouterInputs["replicate"]["getModelVersion"];
        }) => {
          return await di.api.trpc.replicate.getModelVersion.query(input);
        },
      ),
  };

  constructor(di: DiContainer, data: ReplicateData) {
    super("NodeReplicate", di, data, replicateMachine, {});
  }
}
