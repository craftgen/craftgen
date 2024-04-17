import {
  setup,
  type ActorRefFrom,
  enqueueActions,
  assign,
  AnyActorRef,
} from "xstate";
import { inputSocketMachine } from "./input-socket";
import { isNull } from "lodash";

/**
 * This is machine for computing values for the event required sockets.
 *
 */
export const ComputeEventMachine = setup({
  types: {
    input: {} as {
      inputs: Record<string, any>;
      inputSockets: Record<string, ActorRefFrom<typeof inputSocketMachine>>;
      event: string;
      parent: AnyActorRef;
    },
    context: {} as {
      inputSockets: Record<string, ActorRefFrom<typeof inputSocketMachine>>;
      event: string;
      inputs: Record<string, any>;
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
        console.log("COMPUTE EVENT SET VALUE", values);
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
      parent: input.parent,
    };
  },
  initial: "computing",
  states: {
    computing: {
      entry: enqueueActions(({ context, enqueue }) => {
        console.log("EVENT COMPUTER", context);
        const inputSockets = Object.values(context.inputSockets);
        for (const socket of inputSockets) {
          enqueue.sendTo(socket, ({ self }) => ({
            type: "COMPUTE",
            params: {
              targets: [self.id],
            },
          }));
        }
      }),
      on: {
        SET_VALUE: {
          actions: enqueueActions(({ enqueue, context, event }) => {
            console.log("SET VALUE ON EXECUTION", event);
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
        console.log("DONE COMPUTING EVENT", context);
        enqueue.sendTo(
          ({ context }) => context.parent,
          ({ context, self }) => ({
            type: context.event,
            params: {
              inputs: context.inputs,
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
