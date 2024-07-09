import { merge } from "npm:lodash-es@4.17.21";
import { evaluate } from "npm:mathjs@13.0.1/number";
import {
  enqueueActions,
  fromPromise,
  setup,
  type ActorLogicFrom,
  type AnyActorRef,
  type PromiseActorLogic,
} from "npm:xstate@5.14.0";

/**
 * @param expression Mathematical expression to evaluate
 * @example
 * run("2 + 3") // returns 5
 * @returns  The result of the evaluation
 */
export function run(expression: string): number {
  return evaluate(expression);
}

/**
 * This actor is used to run the mathematical expression.
 */
export const runActorPromise: PromiseActorLogic<
  number,
  { expression: string }
> = fromPromise(async ({ input }: { input: { expression: string } }) => {
  const result = await run(input.expression);
  return result;
});

// export const runActorPromise: PromiseActorLogic<number, { expression: string }> = _runActorPromise;
/**
 * This actor is used to run the mathematical expression.
 */
const runActor = setup({
  types: {
    input: {} as {
      inputs: {
        expression: string;
      };
      senders: AnyActorRef[];
    },
    context: {} as {
      inputs: {
        expression: string;
      };
      outputs: {
        result?: number | string | undefined;
      };
      senders?: AnyActorRef[];
    },
  },
  actors: {
    run: runActorPromise,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFsCGAXAFgJQK4DsA6AJwPwEt8oBiCAe3zEMoDc6BrJtLPI0-ClQSs6AYwzkGAbQAMAXVlzEoAA51Y5dJPzKQAD0QBGAJwBmQgDYALAA4rpgOwBWADQgAnohuHCTgL5+btw4BCRklDRgxMR0xIQqADYYAGaxyITBvGECEcL4bOJa0vKKumoaRTpI+kZmlrb2zm6eCIYOVoTGTqaGAEz+AW74dBBwupkEZeqa2roGCAC0Fs2IS4MgE3zhVFMVs9XzVr0rCMYdvb0WThb965uEonTIiWDoYLszDHOIpr3ml9dfjczGduidDDJeoQLlcbgMghgQkQojFiB9Kt8EL9-rCgb0QVYwR5ak5LA5jBYbM4AgEgA */
  id: "mathRun",
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
                  result: String(event.error),
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

export const actor: ActorLogicFrom<typeof runActor> = runActor;
