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
import { isEqual, isNil, merge } from "lodash";
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
          self: ActorRefFrom<typeof outputSocketMachine>;
          definition: JSONSocket;
          parent: {
            id: string;
          };
        };
        system: any;
      }) => {
        if (isNil(input.self)) {
          console.log("No self", input.self);
          // throw new Error("No self");
          return of({});
        }

        return from(input.self).pipe(
          switchMap((state) => {
            return of(state.context.definition["x-connection"] || {});
          }),
          debounceTime(150),
          distinctUntilChanged(isEqual),
        );
        // const events = from(parent);
        // const definition = input.definition;
        // return events.pipe(
        //   switchMap((state) => {
        //     return of(state.context.outputs[definition["x-key"]]);
        //   }),
        //   debounceTime(150),
        //   distinctUntilChanged(isEqual),
        // );
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
      actions: enqueueActions(({ enqueue, event, check }) => {
        console.log("OUTPUT WATCHER", event.snapshot.context);
        if (check(({ event }) => !isNil(event.snapshot.context))) {
          Object.values(event.snapshot.context).forEach((conn) => {
            enqueue.sendTo(
              // ({ system }) => system.get(conn.target),
              conn as ActorRefFrom<typeof inputSocketMachine>,
              ({ system, context }) => ({
                type: "SET_CONNECTION",
                params: {
                  value: system.get(context.parent.id).getSnapshot().context
                    .outputs[context.definition["x-key"]],
                },
              }),
            );
          });
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
