import { merge } from "npm:lodash-es";
import {
  enqueueActions,
  fromPromise,
  setup,
  type AnyActorRef,
} from "npm:xstate";

import { run } from "./main.ts";

export const runActor = setup({
  types: {} as {
    input: {
      inputs: {
        expression: string;
      };
      senders: AnyActorRef[];
    };
    context: {
      inputs: {
        expression: string;
      };
      outputs: {
        result?: any;
      };
      senders?: AnyActorRef[];
    };
  },
  actors: {
    run: fromPromise(async ({ input }: { input: { expression: string } }) => {
      const result = await run(input.expression);
      return result;
    }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgFsBDAFwAsA6AJwFcN8QAHLWASxNa3qRAA9EAtADZ0AT0FDkaEMXLU68jBlYYoDZmw5cG-BABYArBQCMegAxCATAGZLAdgPGDZu9bGIAHMYrOzZy8bWppYGAJwG1lLospS0GBQAxlgEjAA2YCRg6izsnNygunqW7gjGHnYUfn5leqFCHnpOkVLIQA */
  id: "math.run",
  initial: "running",
  context: ({ input }) => {
    return merge(
      {},
      {
        outputs: {
          result: undefined,
        },
      },
      input,
    );
  },
  states: {
    running: {
      invoke: {
        src: "run",
        input: ({ context }) => ({
          expression: context.inputs.expression,
        }),
        onDone: {
          target: "complete",
          actions: enqueueActions(({ enqueue, self, context }) => {
            enqueue.assign({
              outputs: ({ event }) => ({
                result: event.output,
                ok: true,
              }),
            });
            for (const sender of context.senders!) {
              enqueue.sendTo(
                ({ system }) => system.get(sender.id),
                ({ context }) => ({
                  type: "RESULT",
                  params: {
                    id: self.id,
                    res: context.outputs,
                  },
                }),
              );
            }
          }),
        },
        onError: {
          target: "error",
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({
              outputs: ({ event }) => {
                return {
                  result: event.error,
                  ok: false,
                };
              },
            });
          }),
        },
      },
    },
    complete: {
      type: "final",
    },
    error: {
      type: "final",
    },
  },
});
