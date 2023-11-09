import { expect, test } from "bun:test";
import { assign, createActor, createMachine } from "xstate";

test("xstate", async () => {
  const mac = createMachine({
    id: "mac",
    initial: "idle",
    types: {} as {
      context: {
        text: string | null;
      };
    },
    context: {
      text: null,
    },
    states: {
      idle: {
        on: {
          run: {
            target: "running.createNumber",
          },
        },
      },
      running: {
        entry: assign({
          text: "123",
        }),
        initial: "init",
        states: {
          init: {},
          createString: {},
          createNumber: {},
        },
      },
    },
  });

  const actor = createActor(mac);

  actor.subscribe((next) => {
    console.log(next.value);
  });

  actor.send({
    type: "run",
  });

  actor.start();
});
