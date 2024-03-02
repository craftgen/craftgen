import {
  ActorRefFrom,
  AnyActorRef,
  Spawner,
  enqueueActions,
  fromObservable,
  setup,
} from "xstate";
import { JSONSocket } from "./controls/socket-generator";
import { isNil, merge } from "lodash-es";
import { init } from "@paralleldrive/cuid2";
import { Observable, from } from "rxjs";

function createId(prefix: "context", parentId: string) {
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
      value: Observable<any>;
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
        },
  },
}).createMachine({
  id: "InputSocketMachine",
  context: ({ input, spawn }) => {
    return {
      ...input,
      parent: {
        id: input.parent.id,
      },
    };
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
    SET_VALUE: {
      actions: enqueueActions(({ enqueue, event, system }) => {
        console.log("SETVALUE_SOCKET", { event });
        enqueue.sendTo(
          ({ context }) => system.get(context.parent.id),
          ({ context, event }) => {
            const key = context.definition["x-key"];
            console.log("SETVALUE_SOCKET", {
              key,
              value: event.params.value,
            });
            return {
              type: "SET_VALUE",
              params: {
                values: {
                  [key]: event.params.value,
                },
              },
            };
          },
        );
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
          guard: ({ context }) => isNil(context.definition["x-actor-type"]),
          target: "#InputSocketMachine.basic",
        },
      ],
    },
    basic: {},
    actor: {
      initial: "initialize",
      states: {
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

            // enqueue.raise(({ system }) => ({
            //   type: "SET_VALUE",
            //   params: {
            //     value: system.get(actorId),
            //   },
            // }));
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
}): Record<string, ActorRefFrom<typeof inputSocketMachine>> =>
  Object.values(inputSockets)
    .map((socket) =>
      spawn("input", {
        input: {
          definition: socket,
          parent: self,
        },
        id: `${self.id}:input:${socket["x-key"]}`,
        syncSnapshot: true,
        systemId: `${self.id}:input:${socket["x-key"]}`,
      }),
    )
    .map((socket) => ({
      [socket.id]: socket,
    }))
    .reduce((acc, val) => merge(acc, val), {});
