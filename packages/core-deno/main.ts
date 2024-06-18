import { assign, createActor, setup } from "xstate";

export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Counter machine that increments a count.
 */
const counter = setup({
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
  id: "counter",
  context: {
    count: 0,
  },
  initial: "active",
  states: {
    active: {
      on: {
        INC: {
          actions: assign({
            count: ({ context }) => context.count + 1,
          }),
        },
      },
    },
  },
});

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log("Add 2 + 3 =", add(2, 3));
  const actor = createActor(counter, {});
  actor.start();
  actor.subscribe((state) => {
    console.log("STATA", state.context.count);
  });
  actor.send({
    type: "INC",
  });
  actor.send({
    type: "INC",
  });
  actor.send({
    type: "INC",
  });

  actor.stop();
}
