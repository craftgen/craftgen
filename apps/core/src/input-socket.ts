import {
  ActorRefFrom,
  AnyActorRef,
  Spawner,
  enqueueActions,
  fromObservable,
  setup,
} from "xstate";
import { JSONSocket } from "./controls/socket-generator";
import { get, isEqual, isNil, merge } from "lodash-es";
import { init } from "@paralleldrive/cuid2";
import { P, match } from "ts-pattern";
import { valueActorMachine } from "./value-actor";
import {
  of,
  from,
  switchMap,
  debounceTime,
  distinctUntilChanged,
  BehaviorSubject,
  startWith,
} from "rxjs";

function createId(prefix: "context" | "value", parentId: string) {
  const createId = init({
    length: 10,
    fingerprint: parentId,
  });
  return `${prefix}_${createId()}`;
}

export const inputSocketMachine = setup({
  types: {
    context: {} as {
      definition: JSONSocket;
      value: ActorRefFrom<typeof valueActorMachine> | AnyActorRef | undefined;
      parent: {
        id: string;
      };
    },
    input: {} as {
      definition: JSONSocket;
      parent: AnyActorRef;
    },
    events: {} as
      | {
          type: "UPDATE_SOCKET";
          params: Partial<JSONSocket>;
        }
      | {
          type: "ADD_CONNECTION";
          params: {
            [key: string]: string;
          };
        }
      | {
          type: "SET_VALUE";
          params: {
            value: any;
          };
        }
      | {
          type: "ASSIGN_ACTOR";
          params: {
            value: AnyActorRef;
          };
        }
      | {
          type: "TRIGGER";
        }
      | {
          type: "CHANGE_FORMAT";
          params: {
            value: "expression" | "secret" | "date" | "uri";
          };
        }
      | {
          type: "COMPUTE";
          params?: {
            value?: any;
            targets?: string[];
          };
        }
      | {
          type: "RESULT";
          params: {
            value: any;
            targets: string[];
          };
        },
  },
  actors: {
    value: valueActorMachine,
    valueWatcher: fromObservable(
      ({
        input,
        system,
      }: {
        input: {
          value: ActorRefFrom<typeof valueActorMachine>;
          definition: JSONSocket;
          parent: {
            id: string;
          };
        };
        system: any;
      }) => {
        const actor = match(input.value)
          .with(
            {
              src: P.string,
            },
            (value) => {
              return value;
            },
          )
          .with(
            {
              id: P.string,
            },
            (value) => {
              return system.get(value.id);
            },
          )
          .run();

        const initialSnapshotSubject = new BehaviorSubject(actor.getSnapshot());

        return from(actor).pipe(
          startWith(initialSnapshotSubject.value), // Start with the snapshot
          switchMap((state) => {
            return of(state.context.value);
          }),
          debounceTime(150),
          distinctUntilChanged(isEqual),
        );
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEkB2AHArgFwMoHsBjAazGwFkBDQgCwEtUwBiAVQAUARAQQBUBRAPq4A8gGEA0nx4BtAAwBdRKHT5YdbHXyolIAB6IALAA4AbADoA7AEYArCasmTFmwCYTdkwBoQAT0QvZAGYzWRMXG1kAThtIwNdAk0iAXyTvNCw8IlIKanpGJi4ODgFRYQA5Mr5RHmRyuUUkEBU1DS0dfQRjWTMbIwNAhIt+q0iLI28-BCtZCx7AqzcrAwMrKyNA9ZS0jBwCEjIqWgZmACU+cmEANUFSiqqauoUdZvVNbUaOgxMDM3XI0MCLhcI3cE0QCy2IHSuyyB1yxzMDAyZh4JxYfCY9WeqlebQ+4KMVjMJiCUX+RgpY1iYKmkXcllCQPcqwssgMFkh0My+xyR0YiJ22DMADEuAAZXAYrGNF6td6gDprIkkwJk2QUoxUwI0gKrMwuTVfZxWQLWDmpKGCvbZQ55MBmQhaRiEOVmGiUWCiJ1gF1vTFPGU4uXtfwbfVfTUmOKRSKRmw6hw2Mx0lwGNmuSJKzlW2G8u0O72+rRmVD4L2oZ1y-0NZRBt4hhAuMOpkyR6Oxiyg3z+YFEmz9FYp9UGGyBbMZa1wvn22C5swQMhgABOAFtjtXsS16-jG7YzCC+gZwrIIjEaUsbETAv0SQsTyO3OOYTzbQjZzz54vV+vpFYa006zxBV-BPfc6UPY9T0ic9nB+NwEl6NwoKMJ9uRteF+XfbJP2wZc13yaQXH-WVt2A3ckwPZZIJPaDuwQaIXDMeZO3VAFVQsMcLS5Sc8zfOdsCXOgoBgJcN0DLcgL0QxZD7f4whcCwLH+dltToqwhiJTsEKMJCaJMVCeNfTD+ME4TlwLCsfSrVFkAAcVsvgTmlWsJPlKSEFHYJNWvaYIjCewXHPKNuhjU1rFkA0o1GAzcyMmcTKEkSLMrP1nIA1yGycH5FMJE1CUcWxaMmdS7EsMYAkzGwIkzfSuJzF8MPij8ACMPToQgxJc3E3M+PUYkZBSlLZCxUxpWJIl+dSSSMNiZhsGKGunMwsLIMxWrUQhEQgAAbZhSnINgWH4NKSMkjojFK+Z1WcWQTwU-saUPEIwn6AZRgu5YFvQpaVqFdb2q23amDOXAWDFGQAy64Md1McwIoGHSWQCcIaSGIw5jvS8xjGGYvqnfNfrWtrNroHa9oACS4MoHIEYVhBOcheBOwCesQJSfgiwkgTpBY03GOj3EYmMY07aJRlCFC6onWLGuWud-pJsmmElHgBEucV0WZjKYdcZMR1VSrUziCwaSq2YIzRoYARcZIpefb6Cfl4nkqsv0VbVjW+C17qG1HCi02CxllkiQK6J0ibhou2xbtcPHeOMlrncdSyi1QTr0p9ndW2ysZVg2Bx7F6Mb+1+QE1hjElvhGOO4rlj9qGwfAlxd1OClwXA7LKAQuGqenvehsiquCU01lMXsYjPNSmwmmaSSiftvmsAwa9lwmG6bluq3d9WxU1yGM4H9y026EdFI0gIZqic9U2ymT+kzQ0ghXn653X5vk5SrQmH2w7jv307WadCCL8JsAcVhjBJPGNSIwfhhBkiqWMNtojP0dvXF0G8P6uy-v3Ui7kh5MWsBSMIqwJ5FXBAMJMAwOJsgqp2UcKC+JoMbs3JcYBKAQB8N-YQB0jpe3-izBsHFZh+VNCeW6JowjX16CEIYzh-ieWiLVbY0tFqoOwm-MwrD2GcJwWdRA9h0bhCjPYOIVVVih2KksdGiljAGH+EsDYikGEJ3Ueg5uDBXiUG2nQAAXswLg7dO7d17k5fh2tB6jgIaPYhhVJ7FSPOYBIfxw6dhtikC0pYFzwEaNxGW05NyZzIgAWhGDqOxPRYjOBsb0KMXxnH2iRDgAph8Og23PJqdGAU7EjU7A4+pApkSonRM03BrToi-FHNMHSFCgj82KqMIk6wgTzFsKYSp-TGlClFBKPgIy9EIEUueOkE0BjLJIWs00-TMGpz2YAtpdEAhjF+K2VkUcbAjUiMvO2aF8YImua6d0npCyHwAQ2OIjE7GtguhEL4vMvAPPUoxdU4d5JkiUZaFRDs-nAreCWMsOLJKgp3IchFiQegUg2LMwYdTvmGVXrmW5DZ7mTAGOYF5xhEiEiPPQ2leS1GrQXLhb8jBGXEpNnRMWyY+hKSttyps-TCYCUSsuUVZE4jBH6vJRSykOLnn7F5GMhIQ5sk+bjXlqjGHYSVWZdxZNVXuSpCEA0CwbZdPVDBeYPRwgjBGNGS86LckWpcata1SV-m4KJYPPcfQAQjCbE4IEHq+zeszLECeDgFVOw2vajoCQNVySBNq4ao06JHmCLnFsqwoX2HNMo+2vzg1-WdqTXaObECEiTBdRSt4IgzU+WNZYFSEj2BHSHUwmbE4bU3hGgRO5XCdoDvMEOgxE0Sptj0IaMqRgxECLbOtPz45NVccwttCBWVmAHFQw0-RV3FVCMqXKo5bpRGjBO49GCCVuUjUfCKvwuZLHVDzB6alrxJibG4GYlcnAUjfatDRWiOGnucOYVktT2TRCXWQqYcROk0QUuyNw1hOL7rpS-JhG8PEaC8b4sAp6Ng-Evaaa9gILHggSSEf4gJYwjyI+kpIQA */
  id: "InputSocketMachine",
  context: ({ input, spawn }) => {
    const value = match(input.definition)
      .with(
        {
          "x-actor-type": P.string.select(),
        },
        (type) => {
          return undefined;
        },
      )
      .otherwise(() => {
        const valueId = createId("value", input.parent.id);
        return spawn("value", {
          input: { value: input.definition.default },
          id: valueId,
          systemId: valueId,
          syncSnapshot: true,
        });
      });
    return {
      ...input,
      value,
      parent: {
        id: input.parent.id,
      },
    };
  },
  on: {
    UPDATE_SOCKET: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue.assign({
          definition: ({ context, event }) => ({
            ...context.definition,
            ...event.params,
          }),
        });
      }),
    },

    ADD_CONNECTION: {
      actions: enqueueActions(({ enqueue, event }) => {
        enqueue.assign({
          definition: ({ context }) => ({
            ...context.definition,
            "x-connection": {
              ...context.definition["x-connection"],
              ...event.params,
            },
          }),
        });
      }),
    },
    REMOVE_CONNECTION: {
      actions: enqueueActions(({ enqueue, event }) => {
        enqueue.assign({
          definition: ({ context }) => {
            const connections = { ...context.definition["x-connection"] };
            Object.keys(event.params).forEach((key) => {
              delete connections[key];
            });
            return {
              ...context.definition,
              "x-connection": connections,
            };
          },
        });
      }),
    },
  },
  type: "parallel",
  states: {
    input: {
      initial: "FALSE",
      states: {
        TRUE: {
          entry: enqueueActions(({ enqueue }) => {
            enqueue.sendTo(
              ({ system }) => system.get("editor"),
              ({ self }) => ({
                type: "ADD_INPUT_SOCKET",
                params: {
                  socket: self,
                },
              }),
            );
          }),
          always: [
            {
              guard: ({ context }) =>
                !context.definition["x-showSocket"] ||
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length > 0,
              target: "#InputSocketMachine.input.FALSE",
            },
          ],
        },
        FALSE: {
          entry: enqueueActions(({ enqueue }) => {
            enqueue.sendTo(
              ({ system }) => system.get("editor"),
              ({ self }) => ({
                type: "REMOVE_INPUT_SOCKET",
                params: {
                  id: self.id,
                },
              }),
            );
          }),
          always: [
            {
              guard: ({ context }) =>
                context.definition["x-showSocket"] &&
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length === 0,
              target: "#InputSocketMachine.input.TRUE",
            },
          ],
        },
      },
    },
    connection: {
      initial: "noConnection",
      states: {
        hasConnection: {
          always: [
            {
              guard: ({ context }) =>
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length === 0,
              target: "#InputSocketMachine.connection.noConnection",
            },
          ],
        },
        noConnection: {
          always: [
            {
              guard: ({ context }) =>
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length > 0,
              target: "#InputSocketMachine.connection.hasConnection",
            },
          ],
        },
      },
    },
    socket: {
      initial: "determine",
      states: {
        determine: {
          always: [
            {
              guard: ({ context }) =>
                !isNil(context.definition["x-actor-type"]),
              target: "#InputSocketMachine.socket.actor.initialize",
            },
            {
              guard: ({ context }) => context.definition["type"] === "trigger",
              target: "#InputSocketMachine.socket.trigger",
            },
            {
              guard: ({ context }) => isNil(context.definition["x-actor-type"]),
              target: "#InputSocketMachine.socket.basic",
            },
          ],
        },
        trigger: {
          initial: "idle",
          always: [
            {
              guard: ({ context }) =>
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length > 0,
              target: "#InputSocketMachine.socket.trigger.connection",
            },
          ],
          states: {
            idle: {},
            connection: {
              always: [
                {
                  guard: ({ context }) =>
                    Object.values(
                      get(context, ["definition", "x-connection"], {}),
                    ).length === 0,
                  target: "#InputSocketMachine.socket.trigger.idle",
                },
              ],
              on: {
                TRIGGER: {
                  actions: enqueueActions(({ enqueue }) => {
                    enqueue.sendTo(
                      ({ system, context }) => system.get(context.parent.id),
                      ({ context }) => ({
                        type: context.definition["x-event"],
                      }),
                    );
                  }),
                },
              },
            },
          },
        },
        basic: {
          initial: "idle",
          always: [
            {
              guard: ({ context }) =>
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length > 0,
              target: "#InputSocketMachine.socket.basic.connection",
            },
          ],
          entry: enqueueActions(({ enqueue, check }) => {
            if (check(({ context }) => context.definition["x-showSocket"])) {
              enqueue.sendTo(
                ({ system }) => system.get("editor"),
                ({ self }) => ({
                  type: "ADD_INPUT_SOCKET",
                  params: {
                    socket: self,
                  },
                }),
              );
            }
          }),
          states: {
            idle: {
              invoke: {
                src: "valueWatcher",
                input: ({ context, self }) => ({
                  ...context,
                }),
                onSnapshot: {
                  actions: enqueueActions(
                    ({ enqueue, event, context, check }) => {
                      enqueue.raise({
                        type: "COMPUTE",
                        params: {
                          value: event.snapshot.context,
                        },
                      });
                    },
                  ),
                },
              },
              on: {
                COMPUTE: {
                  actions: enqueueActions(
                    ({ enqueue, event, context, self }) => {
                      const value =
                        event?.params?.value ||
                        context.value?.getSnapshot().context.value;
                      // console.log("COMPUTE BASIC", value, event, context);
                      enqueue.spawnChild("computeValue", {
                        input: {
                          value,
                          definition: context.definition,
                          targets: [
                            context.parent.id,
                            ...(event?.params?.targets || []),
                          ],
                          parent: self,
                        },
                        syncSnapshot: false,
                      });
                    },
                  ),
                },
                RESULT: {
                  actions: enqueueActions(({ enqueue, event }) => {
                    // event.params.targets.forEach((target) => {
                    // });
                    enqueue.sendTo(
                      ({ context, system }) => system.get(context.parent.id),
                      ({ event, context, self }) => ({
                        type: "SET_VALUE",
                        params: {
                          values: {
                            [context.definition["x-key"]]: event.params.value,
                          },
                        },
                        origin: {
                          type: "inputsocket.basic",
                          id: self.id,
                        },
                      }),
                    );
                  }),
                },
                CHANGE_FORMAT: {
                  guard: ({ context }) =>
                    get(context, ["definition", "x-canChangeFormat"], true),
                  actions: enqueueActions(({ enqueue }) => {
                    enqueue.assign({
                      definition: ({ context, event }) => ({
                        ...context.definition,
                        format: event.params.value,
                      }),
                    });
                  }),
                },
                SET_VALUE: {
                  /**
                   * We are setting the value of the valueActor here.
                   */
                  actions: enqueueActions(({ enqueue, event }) => {
                    enqueue.sendTo(
                      ({ context }) => context.value,
                      ({ event }) => ({
                        type: "SET_VALUE",
                        params: {
                          value: event.params.value,
                        },
                      }),
                    );
                  }),
                },
              },
            },
            connection: {
              always: [
                {
                  guard: ({ context }) =>
                    Object.values(
                      get(context, ["definition", "x-connection"], {}),
                    ).length === 0,
                  target: "#InputSocketMachine.socket.basic.idle",
                },
              ],
              entry: enqueueActions(({ enqueue }) => {
                enqueue.sendTo(
                  ({ system }) => system.get("editor"),
                  ({ self }) => ({
                    type: "REMOVE_INPUT_SOCKET",
                    params: {
                      id: self.id,
                    },
                  }),
                );
              }),
              on: {
                SET_VALUE: {
                  actions: enqueueActions(({ enqueue, event }) => {
                    enqueue.sendTo(
                      ({ system, context }) => system.get(context.parent.id),
                      ({ event, context, self }) => ({
                        type: "SET_VALUE",
                        params: {
                          values: {
                            [context.definition["x-key"]]: event.params.value,
                          },
                          origin: {
                            type: "inputsocket.connection",
                            id: self.id,
                          },
                        },
                      }),
                    );
                  }),
                },
              },
            },
          },
        },
        actor: {
          initial: "initialize",
          states: {
            connection: {
              always: [
                {
                  guard: ({ context }) =>
                    Object.values(
                      get(context, ["definition", "x-connection"], {}),
                    ).length === 0,
                  target: "#InputSocketMachine.socket.actor.ready",
                  actions: enqueueActions(({ enqueue }) => {
                    enqueue.sendTo(
                      ({ system, context }) => system.get(context.parent.id),
                      ({ context, self }) => ({
                        type: "SET_VALUE",
                        params: {
                          values: {
                            [context.definition["x-key"]]: context.value,
                          },
                        },
                        origin: {
                          type: "inputsocket.actor.connection",
                          id: self.id,
                        },
                      }),
                    );
                  }),
                },
              ],
              on: {
                ASSIGN_ACTOR: {
                  target: "#InputSocketMachine.socket.actor.ready",
                  actions: enqueueActions(({ enqueue, event }) => {
                    console.log(
                      "ACTOR INPUT SOCKET SET VALUE CALLED ON INITIALIZE",
                      event,
                    );
                    enqueue.assign({
                      value: event.params.value,
                    });
                  }),
                },
                SET_VALUE: {
                  actions: enqueueActions(({ enqueue, event }) => {
                    console.log("ACTOR INPUT SOCKET SET VALUE CALLED", event);
                    enqueue.sendTo(
                      ({ system, context }) => system.get(context.parent.id),
                      ({ event, context, self }) => ({
                        type: "SET_VALUE",
                        params: {
                          values: {
                            [context.definition["x-key"]]: event.params.value,
                          },
                        },
                        origin: {
                          type: "inputsocket.actor.connection",
                          id: self.id,
                        },
                      }),
                    );
                  }),
                },
                COMPUTE: {
                  actions: enqueueActions(({ enqueue, context, event }) => {
                    console.log(
                      "ACTOR INPUT COMPUTE CALLED",
                      context.definition["x-connection"],
                      event,
                    );
                    for (const outputSocketKey of Object.keys(
                      context.definition["x-connection"] || {},
                    )) {
                      console.log("CALLING COMPUTE");
                      enqueue.sendTo(
                        ({ system }) => system.get(outputSocketKey),
                        {
                          type: "COMPUTE",
                          params: {
                            targets: [...event.params?.targets],
                          },
                        },
                      );
                    }
                  }),
                },
              },
            },
            ready: {
              always: [
                {
                  guard: ({ context }) =>
                    Object.values(
                      get(context, ["definition", "x-connection"], {}),
                    ).length > 0,
                  target: "#InputSocketMachine.socket.actor.connection",
                  actions: enqueueActions(({ enqueue }) => {
                    console.log("MOVING TO CONNECTION");
                  }),
                },
              ],
              on: {
                COMPUTE: {
                  actions: enqueueActions(({ enqueue, event, context }) => {
                    console.log("ACTOR COMPUTE", context, event);
                    enqueue.sendTo(context.value, {
                      type: "COMPUTE",
                      params: {
                        targets: [context.parent.id],
                      },
                    });
                  }),
                },
              },
            },
            initialize: {
              on: {
                ASSIGN_ACTOR: {
                  target: "#InputSocketMachine.socket.actor.ready",
                  actions: enqueueActions(({ enqueue, event }) => {
                    console.log(
                      "ACTOR INPUT SOCKET SET VALUE CALLED ON INITIALIZE",
                      event,
                    );
                    enqueue.assign({
                      value: event.params.value,
                    });
                  }),
                },
              },
              entry: enqueueActions(({ enqueue, context }) => {
                console.log("ACTOR TYPE", context);
                const actorId = createId("context", context.parent.id);
                enqueue.sendTo(
                  ({ system }) => system.get("editor"),
                  ({ self, context }) => ({
                    type: "SPAWN",
                    params: {
                      parent: context.parent.id,
                      id: actorId,
                      machineId: context.definition["x-actor-type"],
                      systemId: actorId,
                      input: {
                        inputs: {
                          ...(context.definition.default as any),
                        },
                        parent: {
                          id: context.parent.id,
                          port: self.id,
                        },
                      } as any,
                    },
                  }),
                );
              }),
            },
          },
        },
      },
    },
  },
});

export const spawnInputSockets = ({
  spawn,
  self,
  inputSockets,
}: {
  spawn: Spawner<any>;
  self: AnyActorRef;
  inputSockets: Record<string, JSONSocket>;
}): Record<string, ActorRefFrom<typeof inputSocketMachine>> => {
  return Object.values(inputSockets)
    .map((socket) => {
      return spawn("input", {
        input: {
          definition: socket,
          parent: self,
        },
        id: `${self.id}:input:${socket["x-key"]}`,
        syncSnapshot: true,
        systemId: `${self.id}:input:${socket["x-key"]}`,
      });
    })
    .map((socket) => ({
      [socket.id]: socket,
    }))
    .reduce((acc, val) => merge(acc, val), {});
};
