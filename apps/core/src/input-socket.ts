import {
  ActorRefFrom,
  AnyActorRef,
  Spawner,
  enqueueActions,
  setup,
} from "xstate";
import { JSONSocket } from "./controls/socket-generator";
import { merge } from "lodash-es";

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

export const inputSocketMachine = setup({
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
  context: ({ input }) => ({
    ...input,
    parent: {
      id: input.parent.id,
    },
  }),
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
            console.log("SETVALUE_SOCKET", { key, value: event.params.value });
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
});