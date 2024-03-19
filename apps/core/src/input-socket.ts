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
          type: "SET_VALUE";
          params: {
            value: any;
          };
        }
      | {
          type: "TRIGGER";
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
  /** @xstate-layout N4IgpgJg5mDOIC5QEkB2AHArgFwMoHsBjAazGwFkBDQgCwEtUwBiAVQAUARAQQBUBRAPq4A8gGEA0nx4BtAAwBdRKHT5YdbHXyolIAB6IATAA4AjADojATgAsB2QFYTAZksmD9gGwAaEAE9EbgC+gT5oWHhEpBTU9IxmEGRgAE4AtgzMcopIICpqGlo6+ggmAOz2ZnZOztYmsk4GBiV1Pv7Fpmb2liUe9o5utSbW9sGhGDgEJGRUtOnxianpTNImWcqq6pra2UWl5ZXVtfWNzX6GBh5mriWWRiWDRk4lTvZOIyBh45FTMbMARpRqQhLBQ6XIbArbRCWAwtAKyaxOMxlEwogyuWRuIxvD4RSbRGZxf6Asx0CAAG2YuCkAgAalwADIsPiZUHrfJbUBFaw2S5GewYx5GDwokweEqwhA2WQVEpGazCoVPayyDzYsa4qLTWJgMxEuiEMyELSMQjsphUni0hlMlnZMHswqGOpmDxWWyNaEeDzWKwSmxGF0uG4eAw1WpetXhCaan6EgH6w3GsCmzbA1Y5NmbR0IJwIpElZVGOqWIMhiW1fmXSwl6Hym6layRz54rWzajYfBJc3UumM5kgu2ZiGcxAhywdZUq2Wu6soiX8gwu6zWbrXBpuR5NjXfAk69udxOoE1mi1Wvu2tZ5LOQ4qyBxmJwPEyWGey4ww04IBHlOW2e4opxZCMLEQnedVox3bUzH3JJD2PVMLwzK9hz0RArERDwSwLJ4XgMUojAlZdrEuXN4WFSw6icXNhlAnEIPxKCYLMJIwEoCBfDTVlkI5VCEHQl0sNsO931uedniROp7G6KwS1kGxglA1B8ASeBsjor4GPSLjwR4ooAFprD9YjGhXGohncEpugMLd6NbOIEmwZI0kYbSHRvFdyz5S4PVdIt7GXFwQNGKMNLsnU9UIVzrxHL9DM-PlF0sXp-KMOxZVFIKwJCltY3C+MDVJCkopQrkpKRew5WFb1ZEaVLvE-WplQ6XCao3cMbNC3LdXyuDkzcy8dOzOxyhub9lxsKjvXq1pGoDVwV3OblXRKazaPAzrd2g01O2K3TEAq8x-LvMUhRkudP1zAN7DwwCUUcWVuUbNbspjTamKNI8+uipDBpvWpZBKF10uMTobGrAjPxeC4USsXopwB2wOpyt7ttgli2NaAb+t465ER9F5oQeflfPndwOkeJwQwMR8MQBpHXsY1GSVQDZKDJOgAC8wF27MxwnY7pzOkwJQ8AHLmfRxnnfN8FMCIA */
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
  },
  initial: "determine",
  states: {
    determine: {
      always: [
        {
          guard: ({ context }) => !isNil(context.definition["x-actor-type"]),
          target: "#InputSocketMachine.actor.initialize",
        },
        {
          guard: ({ context }) => context.definition["type"] === "trigger",
          target: "#InputSocketMachine.trigger",
        },
        {
          guard: ({ context }) => isNil(context.definition["x-actor-type"]),
          target: "#InputSocketMachine.basic",
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
          target: "#InputSocketMachine.trigger.connection",
        },
      ],
      states: {
        idle: {},
        connection: {
          always: [
            {
              guard: ({ context }) =>
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length === 0,
              target: "#InputSocketMachine.trigger.idle",
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
          target: "#InputSocketMachine.basic.connection",
        },
      ],
      states: {
        idle: {
          invoke: {
            src: "valueWatcher",
            input: ({ context, self }) => ({
              ...context,
            }),
            onSnapshot: {
              actions: enqueueActions(({ enqueue, event, context }) => {
                console.log(
                  "SNAPSHOT",
                  context.definition["x-key"],
                  event.snapshot.context,
                );
                enqueue.sendTo(
                  ({ system, context }) => system.get(context.parent.id),
                  ({ event, context }) => ({
                    type: "SET_VALUE",
                    params: {
                      values: {
                        [context.definition["x-key"]]: event.snapshot.context,
                      },
                    },
                  }),
                );
              }),
            },
          },
          on: {
            SET_VALUE: {
              /**
               * We are setting the value of the valueActor here.
               */
              actions: enqueueActions(({ enqueue, event }) => {
                console.log("SETVALUE_SOCKET", { event });
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
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length === 0,
              target: "#InputSocketMachine.basic.idle",
            },
          ],
          on: {
            SET_VALUE: {
              actions: enqueueActions(({ enqueue, event }) => {
                enqueue.sendTo(
                  ({ system, context }) => system.get(context.parent.id),
                  ({ event, context }) => ({
                    type: "SET_VALUE",
                    params: {
                      values: {
                        [context.definition["x-key"]]: event.params.value,
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
      on: {
        SET_VALUE: {
          target: "#InputSocketMachine.actor.ready",
          actions: enqueueActions(({ enqueue, event }) => {
            console.log("ACTOR INPUT SOCKET SET VALUE CALLED", event);
            enqueue.assign({
              value: event.params.value,
            });
            enqueue.sendTo(
              ({ system, context }) => system.get(context.parent.id),
              ({ event, context }) => ({
                type: "SET_VALUE",
                params: {
                  values: {
                    [context.definition["x-key"]]: event.params.value,
                  },
                },
              }),
            );
          }),
        },
      },
      states: {
        connection: {
          always: [
            {
              guard: ({ context }) =>
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length === 0,
              target: "#InputSocketMachine.actor.ready",
              actions: enqueueActions(({ enqueue }) => {
                enqueue.sendTo(
                  ({ system, context }) => system.get(context.parent.id),
                  ({ context }) => ({
                    type: "SET_VALUE",
                    params: {
                      values: {
                        [context.definition["x-key"]]: context.value,
                      },
                    },
                  }),
                );
              }),
            },
          ],
          on: {
            SET_VALUE: {
              actions: enqueueActions(({ enqueue, event }) => {
                console.log("ACTOR INPUT SOCKET SET VALUE CALLED", event);
                enqueue.sendTo(
                  ({ system, context }) => system.get(context.parent.id),
                  ({ event, context }) => ({
                    type: "SET_VALUE",
                    params: {
                      values: {
                        [context.definition["x-key"]]: event.params.value,
                      },
                    },
                  }),
                );
              }),
            },
          },
        },
        ready: {
          always: [
            {
              guard: ({ context }) =>
                Object.values(get(context, ["definition", "x-connection"], {}))
                  .length > 0,
              target: "#InputSocketMachine.actor.connection",
            },
          ],
        },
        initialize: {
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
            enqueue.assign({
              value: {
                id: actorId,
                xstate$$type: 1,
              },
            });
          }),
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
      // const value = match(socket)
      //   .with(
      //     {
      //       "x-actor-type": P.string.select(),
      //     },
      //     (type) => {
      //       console.log("TYPE", type, socket);
      //       return undefined;
      //     },
      //   )
      //   .otherwise(() =>
      //     spawn("value", {
      //       input: { value: socket.default },
      //       syncSnapshot: true,
      //     }),
      //   );
      return spawn("input", {
        input: {
          definition: socket,
          parent: self,
          // value: value,
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
