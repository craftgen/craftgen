import {
  ActorRefFrom,
  AnyActorRef,
  Spawner,
  enqueueActions,
  setup,
} from "xstate";
import { JSONSocket } from "./controls/socket-generator";
import { isNil, merge } from "lodash-es";
import { init } from "@paralleldrive/cuid2";
import { P, match } from "ts-pattern";
import { valueActorMachine } from "./value-actor";

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
          type: "SET_CONNECTION";
          params: {
            value: AnyActorRef | ActorRefFrom<typeof valueActorMachine>;
          };
        },
  },
  actors: {
    value: valueActorMachine,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEkB2AHArgFwMoHsBjAazGwFkBDQgCwEtUwBiAVQAUARAQQBUBRAPq4A8gGEA0nx4BtAAwBdRKHT5YdbHXyolIAB6IAHACYAdLIMB2ACwWAzAasBOWY6tGAjABoQAT0QBaI1sLE3cAVmCLCwA2A1lwo0cDAF9k7zQsPCJSCmp6RhMIMjAAJwBbBmY5RSQQFTUNLR19BHcLMNDY9udg2QtHL19EWyNTaLD3BwNbR2i+idT0jBwCEjIqWkrC4vLKpml3GuVVdU1tWpa2jvcusJ6LPoHvPwQwoxCrYyDHdqMnIMWIAyK2y6zyWwARpQ1IQmLgpAIAGpcAAyLD41R09VOTQuw1sHTiYXiVjaslk4yMYWeiCsIxMb0mVgicSMBkcYWigOBWTWuU2BWo2HwJRMDFOlAANnQAF7MeE8JGo9GY2rYxrnUAtYmmMKc96WT4TKw0hCJELRWyTPVBcIxMJWVJpECofBFeC1HmrHIbfJgLEnDXNAKDF7tEwGdmOZzuT4WdyJFLOr2g-l+7bYUoVRgBhpnYMIGymkbREzWOKOWyyd4cqlc5PLXk+8EFKEw3M4zV6YZ3UKRhMWUYVimmiKmUmTAlvZzV+tLTLesECsAmIUijtBvFmjkmaKWmKjIxzZzM01GFxl6bWKuW1zRGzcxuLtNbNeikpgSgQF7HPO4rWIPeIQ3NEbJ6lYsh0okxbniYtjwV00SDvEVYWI+C6pr6r6EMKorihoUqyv6aqBvmW62HSu77qBozHpB1JDNupZJNGsyyBE9hRE6yRAA */
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
      .otherwise(() =>
        spawn("value", { input: { value: input.definition.default } }),
      );
    return {
      ...input,
      value: value,
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
          guard: ({ context }) => isNil(context.definition["x-actor-type"]),
          target: "#InputSocketMachine.basic",
        },
      ],
    },
    basic: {
      entry: enqueueActions(({ enqueue }) => {
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
      on: {
        SET_CONNECTION: {
          actions: enqueueActions(({ enqueue, event }) => {
            console.log("SETCONNECTION_SOCKET", { event });
            enqueue.sendTo(
              ({ system, context }) => system.get(context.parent.id),
              ({ context }) => ({
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
        SET_VALUE: {
          actions: enqueueActions(({ enqueue, event }) => {
            console.log("SETVALUE_SOCKET", { event });

            enqueue.sendTo(
              ({ system, context }) =>
                system.get(context.parent.id).getSnapshot().context.inputs[
                  context.definition["x-key"]
                ],
              {
                type: "SET_VALUE",
                params: {
                  value: event.params.value,
                },
              },
            );
          }),
        },
      },
    },
    actor: {
      initial: "initialize",
      states: {
        ready: {},
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
          }),
          on: {
            SET_VALUE: {
              target: "ready",
              actions: enqueueActions(({ enqueue, event }) => {
                console.log("ACTOR INPUT SOCKET SET VALUE CALLED", event);
                enqueue.assign({
                  value: event.params.value,
                });
                enqueue.sendTo(
                  ({ context }) => system.get(context.parent.id),
                  ({ context, event }) => {
                    const key = context.definition["x-key"];
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
