import { init } from "@paralleldrive/cuid2";
import { get, isEqual, isNil, merge } from "lodash-es";
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  from,
  of,
  startWith,
  switchMap,
} from "rxjs";
import { match, P } from "ts-pattern";
import {
  ActorRefFrom,
  AnyActorRef,
  enqueueActions,
  fromObservable,
  setup,
  Spawner,
} from "xstate";

import { JSONSocket } from "./controls/socket-generator";
import { inputJsonWatcher } from "./input-output-json-schema-watcher";
import { valueActorMachine } from "./value-actor";

export function createId(prefix: "context" | "value", parentId: string) {
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
          type: "DELETE";
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
    inputJsonWatcher: inputJsonWatcher,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QEkB2AHArgFwMoHsBjAazGwFkBDQgCwEtUwBiAEQFEAZNgFTYG0ADAF1EodPlh1sdfKlEgAHogAsATgEA6AMwBWVcoCMADgDsB5YYE6ANCACeiLQIPa9WkyaMA2LwCYdyv4AvkG2aFh4RKQU1PSMTACqAAosAIK8APq4APIAwgDSPIIiSCDiktKy8koIyqYaygJ+Zuq+AmbKJrYOCG3KGup+OgaqBgJGWl7GIWEYOAQkZFS0DMypLCwZudkAcjtsudzIu8Xy5VIycqU1dS6+JloWqjomwzq+3YhjRg06Wgb+Z4BYwGGYgcLzKJLWKrJgAJTY5GyADU2FtdvtDscdqdSudKldQDcvDoNO8Hl52qMfJSuvYvr4wRDIosYitGBoGBENNw4Qk2ExcWIJBcqtdEL5GgM-gYtL4jKp3ICjJ9egJfKoNAqrKMjJ1-E0mXMWdFlnEwJzjRoAGKpDi4AVCsoignVCVS57-OUKpV6FX0tWvLXqAIk75-I0RBammEcwiyRiEAkaGiUWC5BNgJOXQXCM4uy5u3paH7+Ty+SbykmTf09XyS3waeuNBVqExeEyM0Lg43R6Hsi3x1CJ5OofAZ4dZgm5krCiqF8XF0svIwVvzeP5eWsS+WlyUCCwGKb3ZSRyGss2rDSwKHYDQQMhgABOAFtYU78QuiRKDKTfGN9AsTwDysD4A1-PQNDMMZ-gmPVDC7WYo1vS8ORvVl70fV93wMWdnXnMVvzVP8AIsTojBA95VWMOpgyaQ9RgCQIzxNftzWvW9MOwZ833iPhfDwz9CMUH8SIEQDyMosCejGHQvCg8YNTqLxRmCbtmT7Nl2PQ6INGwJ86CgGAnxnfMCMJETanVDQDy3dt9CMTdJWoiZ5K0EMjDg-xhkQntkIvWMLR0sg9IMoznw0IcRxzXlkAAcTitg4Q-AthJqd5GwmPotxGIwj23BADBMKVlHcP4Kw8ZTT3U3sUMCjiMP0wzjMizNs1kUy8VSiyahJRsK0POSnEc-wXNKjQvEaPRPFXXwOxMFjNNQoLOIAIzTOhCE6udRR6lQARs5Q7JUuonOUaiD36NpVwclSATqRa6oHBrdPWyRCE5CAABtmG2cgkgSXgUvMotHJMCatwEARJnc945VVfRwY7YxPLyjtlB0IxHoC57grvN7Ns+n74TYXAEg4bhgd20GO20bwKLUZw7tUVVHLuYx2yrWV7gWmr-JjXG1o2j66G+36AAlUh2RKMmtbI4XIdIqddRcTGebRXiaKYUecOkelefp2yGlSdXE3mkPPAXtKF96ieYB1uAyZE7X5ZWv0sxz+icTpvZDZwDFVEkfn+fwAJ0A9qWxq2rzxjQCY+qKpxzB2nZd-g8y6kHFz+UlV0CDHVGKhyEblMlPICdtirUUqo7YmObcJxP2tQbb8Opxct1JOydEx9RtVKi7II1I9Jn99wvC0WutPrjDqGwfAn1aydm6YVJcFweKdgyVJDnlt20sQHutC1N5KTK3QvGox55PaPKXnE9zZSn5aXpCueF6X6KOpT52OFdjOdoqyIo0TQHQJhODlB2dyV9hgNA1Kucwph1RymfvVWO79F5N2nH9AGQMAFtyAZZRo-Rb4AmcFodyFhRrgX8P0QuHZhiPB1B4VBgtZ5Jg-lgnM+89oICPifX8Z9XgX2olQskXoSyOSytVC2rFp5oU4hgjQT4wCUAgHYJgODAbp0Et1IsDwfiBGMP+QI-4FQs3ApMfoDMPCqFUPcSkEY+aWzrgo9h89F4qLURonhRYpg-AeKVcw-56z2JsDQgIGh7qqB8LZExOhWHW3cR-BgFxKBfToAALzWOvTe29d7JXwUJXh-C2ZyWhsIuS1E-j9DqBjDUgx1TyhCN2McD54ClA0k9c0Zl25EQALQjFVI8H4eUDQln-B2CsiSrxchwL0whNQNTUX0I2dyTQ9AZRCTMjkcy7y8n5As92NRdBd0aJNZw0M-AUPCXWCpTYKyrj0I0f47wdkWj2TaO0DojkHwQB4VUbRHhQUeYCF5v5fJdJxuxLhwlilFmWQGf8kTOwlk7GrCZjx3mfyTrIFMaYJxfwsvCxcuhGz6D+MNEsPcxiXyRZKH4PdirGEmIqLcMi-IuPkYONqo5xy8vdiSoiAL6VHRsi8Qwrk2V6mxXjX5vDEU9FKm5AE4dOyGEMLoWVnEHzcWwoweV+i9ZfHomXChhgfB1PVNqxqYVjKGtJZE2ypgTqOUrOdcCfUBjjyhqBICXgbW6SauFReosfoOuFT4AY-57HykaEXCxMk9QuG1JSfwFZRhHkDSFYNLVYXEr0dnI8UFHglkMJjUqkwxopsaemx+WbnFyJfrHeOEbLJWMOsdByZ1VRwy1Kq2l2sAhY0bUtNBDcRZizbTUPK4NDBqzsY5RUeoLpqCiZKVQ9MOw+AeNm-GwscXN2nYfOaJbDxtD8IqZwF1gUHiPBjTswIA2ju6TPXSGDj0IAofJBU8FzAUNME86iR55JDGhkqAwRUXh7o0Eo-Nn6XmuAgpDYq37jWFXqVqVcCoR6PDqJPF90K31vw4Z41R6jP2vHBhMTGj63j5VEVGssMSjz2KZqCQj0c3HvtI5aNJGTsmfrLcGP9lbAPUJkjUhoUw709wZQCFpQQgA */
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
    DELETE: {
      guard: ({ context }) => context.definition["x-userDefined"] || false,
      actions: enqueueActions(({ enqueue }) => {
        enqueue.sendTo(
          ({ context, system }) => system.get(context.parent.id),
          ({ self }) => ({
            type: "REMOVE_SOCKET",
            params: {
              side: "input",
              id: self.id,
            },
          }),
        );
      }),
    },

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
          invoke: {
            src: "inputJsonWatcher",
            input: ({ context, self }) => ({
              actor: context.parent,
              triggerSocket: self,
            }),
          },
          on: {
            TRIGGER: {
              actions: enqueueActions(({ enqueue, event, self }) => {
                console.log("TRIGGER EVENT", self.id, event);
                enqueue.sendTo(
                  ({ system, context }) => system.get(context.parent.id),
                  ({ context, event }) => ({
                    type: context.definition["x-event"],
                    params: {
                      inputs: {
                        ...get(event, "params.inputs", {}),
                      },
                      senders: [
                        ...get(event, "params.senders", [
                          { id: context.parent.id },
                        ]),
                      ],
                      callId: get(event, "params.callId"),
                    },
                    origin: {
                      id: self.id,
                      type: self.src,
                    },
                  }),
                );
              }),
            },
          },
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
                    enqueue.assign({
                      value: event.params.value,
                    });
                  }),
                },
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
                "FORWARD.*": {
                  actions: enqueueActions(({ enqueue, event, context }) => {
                    console.log(
                      "INPUT SOCKET EVENT WILD CARD",
                      event.type,
                      context,
                      {
                        ...event,
                        type: event.type.replace("FORWARD.", ""),
                      },
                    );
                    enqueue.sendTo(
                      ({ context, system }) => {
                        const targetId = Object.keys(
                          context.definition["x-connection"],
                        )[0].split(":")[0];
                        console.log("TARGET ID", targetId);
                        const target = system.get(targetId);
                        console.log("TARGET", target);
                        return target;
                      },
                      {
                        ...event,
                        type: event.type.replace("FORWARD.", ""),
                      },
                    );
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
                    // console.log("MOVING TO CONNECTION");
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

export type InputSocketMachineActor = ActorRefFrom<typeof inputSocketMachine>;

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
