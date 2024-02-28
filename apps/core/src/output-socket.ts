import { AnyActorRef, enqueueActions, setup } from "xstate";
import { JSONSocket } from "./controls/socket-generator";

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
}).createMachine({
  id: "OutputSocketMachine",
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
  },
});
