import { expect, test } from "bun:test";
import { fromPairs, isNull } from "lodash";
import {
  assign,
  createActor,
  createMachine,
  enqueueActions,
  fromPromise,
  setup,
} from "xstate";

test("always", async () => {
  const ma = setup({
    actors: {
      ff: fromPromise(async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve("done");
          }, 1000);
        });
      }),
      co: setup({
        types: {
          input: {} as {
            source: string;
            value: number
          } 
        },
        actors: {
          compute: fromPromise(async () => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve("done");
              }, 1000);
            });
          }),
        },
      }).createMachine({
        states: {
          computing: {
            entry: enqueueActions(({ enqueue }) => {
              const inputSockets = Object.values(context.inputSockets);
              for (const input of inputSockets) {
                enqueue.sendTo(({context, system}) => system.get(input), ({context}) => ({
                  type: "RUN",
                  params: {
                    value: context.value,
                  },
                }))
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
            always: [{
          guard: ({ context }) => {
            return Object.values(context.inputs).every((t) => !isNull(t));
          },
          target: "done",
            }]
          },
          done: {
            entry: enqueueActions(({ enqueue }) => {
              enqueue.sendTo(({context, system}) => system.get(context.source), ({context}) => ({
                type: "RUN",
                params: {
                  value: context.value,
                },
              }))
            })
          }
        }
      })
    },
  }).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAYgG0AGAXUVAAcB7WXAF1wf1pAA9EAWABwA6AJwBmAGwCArAEYJsgOwVFigDQgAnolkAmAL6GN+BhDhc0WPISJdGzNhy68EAWlkbtCEbKG7FYnx8uro+0gJiFAb6GpY4BMRCuBAANmB2TKzsnEg8iBIUQhQSYrLSkSKhArqeOorC0iIl4YoSumIdKkYgcdaJAE4Arvj4BFAZDtnO-OpaiO2KRTIifKW6ZQFihoZAA */
    initial: "idle",
    states: {
      idle: {
        on: {
          COMPUTE: {
            actions: enqueueActions(({ enqueue }) => {
              enqueue.spawnChild("co");
            }),
          },
          EXECUTE: {
            actions: enqueueActions(({ enqueue }) => {
              enqueue("ff");
            }),
          },
          }
        },
      },
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
