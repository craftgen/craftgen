import { expect, test } from "bun:test";
import { assign, createActor, createMachine } from "xstate";

test("always", async () => {
  const ma = createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAYgG0AGAXUVAAcB7WXAF1wf1pAA9EAWABwA6AJwBmAGwCArAEYJsgOwVFigDQgAnolkAmAL6GN+BhDhc0WPISJdGzNhy68EAWlkbtCEbKG7FYnx8uro+0gJiFAb6GpY4BMRCuBAANmB2TKzsnEg8iBIUQhQSYrLSkSKhArqeOorC0iIl4YoSumIdKkYgcdaJAE4Arvj4BFAZDtnO-OpaiO2KRTIifKW6ZQFihoZAA */
    initial: "idle",
    context: {
      text: "121",
    },
    always: {
      guard: ({ context }) => {
        if (context.text === "123") {
          return false;
        }
        return true;
      },
      actions: assign({
        text: "123",
      }),
    } as unknown as any,
    states: {
      idle: {},
    },
  });

  const actor = createActor(ma);
  actor.subscribe((events) => {
    console.log(events);
  });
  const a = actor.getPersistedSnapshot();
  console.log(a);
  actor.start();
  const s = actor.getPersistedSnapshot();
  console.log(s);
});

// test.skip("xstate", async () => {
//   const mac = createMachine({
//     id: "mac",
//     initial: "idle",
//     types: {} as {
//       context: {
//         text: string | null;
//       };
//     },
//     context: {
//       text: null,
//     },
//     states: {
//       idle: {
//         on: {
//           run: {
//             target: "running.createNumber",
//           },
//         },
//       },
//       running: {
//         entry: assign({
//           text: "123",
//         }),
//         initial: "init",
//         states: {
//           init: {},
//           createString: {},
//           createNumber: {},
//         },
//       },
//     },
//   });

//   const actor = createActor(mac);

//   actor.subscribe((next) => {
//     console.log(next.value);
//   });

//   actor.send({
//     type: "run",
//   });

//   actor.start();
// });
