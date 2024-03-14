import {
  ActorRefFrom,
  AnyActor,
  AnyActorRef,
  Spawner,
  enqueueActions,
  fromObservable,
  setup,
} from "xstate";
import { JSONSocket } from "./controls/socket-generator";
import {
  distinctUntilChanged,
  from,
  switchMap,
  of,
  debounceTime,
  BehaviorSubject,
  startWith,
} from "rxjs";
import { get, isEqual, isNil, merge } from "lodash";
import { inputSocketMachine } from "./input-socket";

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
      parent: {
        id: string;
      };
    },
    input: {} as {
      definition: JSONSocket;
      parent: AnyActorRef;
    },
    events: {} as {
      type: "UPDATE_SOCKET";
      params: Partial<JSONSocket>;
    },
  },
  actors: {
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
        console.log("PARENT NODE OF OUTPUT SOCKET", parentNodeActor);

        const initialSnapshotSubject = new BehaviorSubject(
          parentNodeActor.getSnapshot(),
        );
        console.log("INITIAL SNAPSHOT", initialSnapshotSubject.value);

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
  id: "OutputSocketMachine",
  context: ({ input }) => ({
    ...input,
    parent: {
      id: input.parent.id,
    },
  }),
  invoke: {
    src: "valueWatcher",
    input: ({ context, self }) => ({
      self,
      ...context,
    }),
    onSnapshot: {
      actions: enqueueActions(({ enqueue, event, check, context, system }) => {
        console.log("OUTPUT WATCHER", event.snapshot.context);
        const connections = get(context, ["definition", "x-connection"], {});
        for (const [key, connection] of Object.entries(connections)) {
          console.log("CONNECTION", key, connection);
          const actor = system.get(key) as ActorRefFrom<
            typeof inputSocketMachine
          >;

          if (actor) {
            actor.send({
              type: "SET_VALUE",
              params: {
                value: event.snapshot.context,
              },
            });
          }
        }
      }),
    },
  },
  on: {
    UPDATE_SOCKET: {
      actions: enqueueActions(({ enqueue, event, system }) => {
        enqueue.assign({
          definition: ({ context, event }) => ({
            ...context.definition,
            ...event.params,
          }),
        });
      }),
    },
  },
});
