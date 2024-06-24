import { init } from "@paralleldrive/cuid2";
import { get, isEqual, merge } from "lodash-es";
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  from,
  of,
  startWith,
  switchMap,
} from "rxjs";
import { match } from "ts-pattern";
import {
  ActorRefFrom,
  AnyActor,
  AnyActorRef,
  enqueueActions,
  fromObservable,
  setup,
  Spawner,
} from "xstate";

import { JSONSocket } from "./controls/socket-generator";
import { inputSocketMachine } from "./input-socket";
import { valueActorMachine } from "./value-actor";

export function createId(prefix: "context" | "value", parentId: string) {
  const createId = init({
    length: 10,
    fingerprint: parentId,
  });
  return `${prefix}_${createId()}`;
}

export const spawnOutputSockets = ({
  spawn,
  self,
  outputSockets,
}: {
  spawn: Spawner<any>;
  self: AnyActorRef;
  outputSockets: Record<string, JSONSocket>;
}): Record<string, ActorRefFrom<typeof outputSocketMachine>> =>
  Object.values(outputSockets)
    .map((socket) =>
      spawn("output", {
        input: {
          definition: socket,
          parent: self,
        },
        id: `${self.id}:output:${socket["x-key"]}`,
        syncSnapshot: true,
        systemId: `${self.id}:output:${socket["x-key"]}`,
      }),
    )
    .map((socket) => ({
      [socket.id]: socket,
    }))
    .reduce((acc, val) => merge(acc, val), {});

export const outputSocketMachine = setup({
  types: {
    context: {} as {
      definition: JSONSocket;
      value: any;
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
          type: "TRIGGER";
        }
      | {
          type: "COMPUTE";
          params: {
            targets: string[];
          };
        }
      | {
          type: "RESOLVE";
          params: {
            values: any;
          };
        },
  },
  actions: {
    setValueForConnections: enqueueActions(
      ({ enqueue, context }, params: { value: any }) => {
        const connections = get(context, ["definition", "x-connection"], {});
        for (const inputSocketKey of Object.keys(connections)) {
          enqueue.sendTo(
            ({ system }) =>
              system.get(inputSocketKey) as ActorRefFrom<
                typeof inputSocketMachine
              >,
            {
              type: "SET_VALUE",
              params: {
                value: params.value,
              },
            },
          );
        }
      },
    ),
  },
  actors: {
    value: valueActorMachine,
    stateMapper: fromObservable(
      ({
        input,
        system,
      }: {
        input: {
          self: AnyActorRef;
        };
        system: any;
      }) => {
        const self = system.get(input.self.id) as AnyActor;

        return from(self).pipe(
          switchMap((state) => {
            return of(state.value);
          }),
          distinctUntilChanged(isEqual),
        );
      },
    ),
    valueWatcher: fromObservable(
      ({
        input,
        system,
      }: {
        input: {
          definition: JSONSocket;
          parent: {
            id: string;
          };
        };
        system: any;
      }) => {
        const parentNodeActor = system.get(input.parent.id) as AnyActor;
        // console.log("PARENT NODE OF OUTPUT SOCKET", parentNodeActor);

        const initialSnapshotSubject = new BehaviorSubject(
          parentNodeActor.getSnapshot(),
        );
        // console.log("INITIAL SNAPSHOT", initialSnapshotSubject.value);

        // return of({});

        return from(parentNodeActor).pipe(
          startWith(initialSnapshotSubject.value),
          switchMap((state) => {
            return of(state.context.outputs[input.definition["x-key"]]);
          }),
          debounceTime(150),
          distinctUntilChanged(isEqual),
        );
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHkCuAXADhgygewGMBrMdAWQEMCALASwDswBiAVQAUARAQQBUBRAPo5kAYQDSfHgG0ADAF1EoTHli10tPPUUgAHogC0ARkMBWAHQAWAGwyAnBYsAOAOwXbj21YA0IAJ4HTGTMAZmMAJhlHFytnQzDggF8EnzQsXEIScio6RjNaCAAbZlkFJBBlVXVNbT0EQ2DzKxMokxMLeODHSJ9-BHirMxNgyNNgtw96pJSMbHR8YlJKGgYwM2oKWBFNRgIq+iYS7Qq1DS0y2vrG5sdW9uDO7r9EQ1tDMzDDGRMZSJtbZysiSmIHoeAgcG0qVm80ySxyYCOKhO1XOAR6iHs71czmC9hiXWGVmBUPSCyyy1y+SKiMqpxqiAsznRdUxzhkrkBoVsMgiFmJM1JsOyKzWGy29B2expyLOoFqYTcZisFmC8RMOLcYUBJmZhkcbxM-yawWcjnuwWVQKSQA */
  id: "OutputSocketMachine",
  // context: ({ input }) => ({
  //   ...input,
  //   parent: {
  //     id: input.parent.id,
  //   },
  // }),
  context: ({ input, spawn }) => {
    const value = match(input.definition)
      // .with(
      //   {
      //     "x-actor-type": P.string.select(),
      //   },
      //   (type) => {
      //     return undefined;
      //   },
      // )
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
  invoke: {
    src: "valueWatcher",
    input: ({ context, self }) => ({
      self,
      ...context,
    }),
    onSnapshot: {
      actions: enqueueActions(({ enqueue, event }) => {
        enqueue.sendTo(
          ({ context }) =>
            context.value as ActorRefFrom<typeof valueActorMachine>,
          {
            type: "SET_VALUE",
            params: {
              value: event.snapshot.context,
            },
          },
        );
      }),
    },
  },
  initial: "idle",
  states: {
    idle: {
      entry: enqueueActions(({ enqueue }) => {
        enqueue.sendTo(
          ({ system }) => system.get("editor"),
          ({ self }) => ({
            type: "ADD_OUTPUT_SOCKET",
            params: {
              socket: self,
            },
          }),
        );
      }),
      always: [
        {
          target: "hasConnection",
          guard: ({ context }) => {
            return (
              Object.values(get(context, ["definition", "x-connection"], {}))
                .length > 0
            );
          },
        },
      ],
    },
    hasConnection: {
      entry: enqueueActions(({ enqueue }) => {
        enqueue.sendTo(
          ({ system }) => system.get("editor"),
          ({ self }) => ({
            type: "REMOVE_OUTPUT_SOCKET",
            params: {
              id: self.id,
            },
          }),
        );
      }),
      initial: "determine",
      always: [
        {
          target: "idle",
          guard: ({ context }) => {
            return (
              Object.values(get(context, ["definition", "x-connection"], {}))
                .length === 0
            );
          },
        },
      ],
      states: {
        determine: {
          always: [
            {
              guard: ({ context }) => context.definition.type === "trigger",
              target: "trigger",
            },
            {
              guard: ({ context }) =>
                context.definition.type.startsWith("Node"),
              target: "actor",
            },
            {
              guard: ({ context }) =>
                !context.definition.type.startsWith("Node"),
              target: "value",
            },
          ],
        },
        trigger: {
          on: {
            TRIGGER: {
              actions: enqueueActions(({ enqueue, context }) => {
                const connections = get(
                  context,
                  ["definition", "x-connection"],
                  {},
                );
                for (const key of Object.keys(connections)) {
                  enqueue.sendTo(
                    ({ system }) =>
                      system.get(key) as ActorRefFrom<
                        typeof inputSocketMachine
                      >,
                    {
                      type: "TRIGGER",
                    },
                  );
                }
              }),
            },
          },
        },
        value: {
          invoke: {
            src: "valueWatcher",
            input: ({ context, self }) => ({
              self,
              ...context,
            }),
            onSnapshot: {
              actions: enqueueActions(({ enqueue, event }) => {
                // enqueue.sendTo(
                //   ({ context }) =>
                //     context.value as ActorRefFrom<typeof valueActorMachine>,
                //   {
                //     type: "SET_VALUE",
                //     params: {
                //       value: event.snapshot.context,
                //     },
                //   },
                // );
                enqueue({
                  type: "setValueForConnections",
                  params: {
                    value: event.snapshot.context,
                  },
                });
              }),
            },
          },
          on: {
            COMPUTE: {
              actions: enqueueActions(({ enqueue }) => {
                enqueue.sendTo(
                  ({ context, system }) => system.get(context.parent.id),
                  ({ event }) => ({
                    type: "COMPUTE",
                    params: {
                      targets: [...event.params.targets],
                    },
                  }),
                );
              }),
            },
            RESOLVE: {
              actions: enqueueActions(({ enqueue, event }) => {
                enqueue({
                  type: "setValueForConnections",
                  params: {
                    value: event.params.value,
                  },
                });
              }),
            },
          },
        },
        actor: {},
      },
    },
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
  },
});

export type OutputSocketMachineActor = ActorRefFrom<typeof outputSocketMachine>;
