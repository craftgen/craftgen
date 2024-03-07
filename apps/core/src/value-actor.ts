import { setup, assign, enqueueActions } from "xstate";

export const valueActorMachine = setup({
  types: {
    context: {} as {
      value: any | undefined; // Stores the current value
    },
    input: {} as {
      value: any;
    },
    events: {} as {
      type: "SET_VALUE";
      params: {
        value: any;
      };
    },
  },
}).createMachine({
  id: "value",
  context: ({ input }) => {
    return {
      value: input.value,
    };
  },
  on: {
    SET_VALUE: {
      actions: enqueueActions(({ enqueue, event }) => {
        enqueue.assign({
          value: event.params.value,
        });
      }),
    },
  },
});
