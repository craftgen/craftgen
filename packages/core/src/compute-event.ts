import { isNull } from "lodash-es";
import {
  AnyActorRef,
  assign,
  enqueueActions,
  setup,
  type ActorRefFrom,
} from "xstate";

import { inputSocketMachine } from "./input-socket";

/**
 * This is machine for computing values for the event required sockets.
 *
 */
export const ComputeEventMachine = setup({
  types: {
    input: {} as {
      inputs: Record<string, any>;
      senders?: string[];
      callId?: string;
      inputSockets: Record<string, ActorRefFrom<typeof inputSocketMachine>>;
      event: string;
      parent: AnyActorRef;
    },
    context: {} as {
      inputSockets: Record<string, ActorRefFrom<typeof inputSocketMachine>>;
      event: string;
      inputs: Record<string, any>;
      senders: string[];
      callId?: string;
    },
    output: {} as {
      inputs: Record<string, any>;
    },
  },
  actions: {
    setValue: assign({
      inputs: (
        { context, event, self },
        params: { values: Record<string, any> },
      ) => {
        const values = event.params?.values || params?.values;
        return {
          ...context.inputs,
          ...values,
        };
      },
    }),
  },
}).createMachine({
  id: "computeEvent",
  context: ({ input }) => {
    const inputs = Object.values(input.inputSockets).reduce(
      (acc, socket) => {
        const definition = socket.getSnapshot().context.definition;
        if (definition.type === "trigger") {
          return acc;
        }

        acc[definition["x-key"]] = null;
        return acc;
      },
      {} as Record<string, null>,
    );
    return {
      event: input.event,
      inputSockets: input.inputSockets,
      inputs: {
        ...inputs,
        ...input.inputs,
      },
      senders: input.senders,
      callId: input.callId,
      parent: input.parent,
    };
  },
  initial: "computing",
  states: {
    computing: {
      entry: enqueueActions(({ context, enqueue, check }) => {
        const inputSockets = Object.values(context.inputSockets);
        for (const socket of inputSockets) {
          const inputKey = socket.getSnapshot().context.definition["x-key"];
          if (check(({ context }) => isNull(context.inputs[inputKey]))) {
            enqueue.sendTo(socket, ({ self }) => ({
              type: "COMPUTE",
              params: {
                targets: [self.id],
              },
            }));
          }
        }
      }),
      on: {
        SET_VALUE: {
          actions: enqueueActions(({ enqueue, context, event }) => {
            enqueue("setValue");
          }),
        },
      },
      always: [
        {
          guard: ({ context }) => {
            return Object.values(context.inputs).every((t) => !isNull(t));
          },
          target: "done",
        },
      ],
    },
    done: {
      type: "final",
      entry: enqueueActions(({ enqueue, context }) => {
        enqueue.sendTo(
          ({ context }) => context.parent,
          ({ context, self }) => ({
            type: context.event,
            params: {
              inputs: context.inputs,
              senders: context.senders,
              callId: context.callId,
            },
            origin: {
              type: "compute-event",
              id: self.id,
            },
          }),
        );
      }),
    },
  },
});
