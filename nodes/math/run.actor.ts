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
 * @example
 * const result = createActor(runActorPromise, {
 *   input: {
 *     expression: "2 + 3"
 *   }
 * });
 * result.start();
 * await waitFor(result, (state) => state.matches("complete"));
 * const res = result.getSnapshot();
 * console.log(res.outputs.result); // 5
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
  /** @xstate-layout N4IgpgJg5mDOIC5QFsCGAXAFgJQK4DsA6AJwPwEt8oBiCAe3zEMoDc6BrJtLPI0-ClQSs6AYwzkGAbQAMAXVlzEoAA51Y5dJPzKQAD0QBGAOwBmQgA5TATgsAWU8YCsAGhABPRAFoATE8syFk7Wjk4AvmFu3DgEJGSUNGDExHTEhCoANhgAZqnIhNG8cQIJwvhs4lrS8oq6ahpVOkj6RiGEAGx29qFunggmdoTWTqaGfhGRIPh0EHC6hQR16praugYIXu293oaG5qaBwaERURgxfPFUSw2rzet2PtsI1oM+Pu1O7eOTC0SidMhMmB0GBrisGGtEKYfOZ3p9oV8Qi8Rk9DDIfIQ3h8vuEfmcikkUsQwY1IQhobDsQifEi7CiPK1-O1jNZ2hZnBMwkA */
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
