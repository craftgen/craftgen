import {
  ActorRefFrom,
  AnyActorRef,
  Spawner,
  enqueueActions,
  fromObservable,
  setup,
} from "xstate";
import { JSONSocket } from "./controls/socket-generator";
import { distinctUntilChanged, from, switchMap, of, debounceTime } from "rxjs";
import { isEqual, merge } from "lodash";

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
        const parent = system.get(input.parent.id);
        const events = from(parent);
        const definition = input.definition;
        return events.pipe(
          switchMap((state) => {
            return of(state.context.outputs[definition["x-key"]]);
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
    input: ({ context }) => context,
    onSnapshot: {
      actions: enqueueActions(({ enqueue, event, context, system, check }) => {
        if (check(({ context }) => context.definition["x-connection"])) {
          for (const [t, conn] of Object.entries(
            context.definition["x-connection"] || {},
          )) {
            console.log("Target", t, "Connection", conn);

            enqueue.sendTo(
              ({ system }) => system.get(t),
              ({ event }) => ({
                type: "SET_VALUE",
                params: {
                  value: event.snapshot.context,
                },
              }),
            );
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
