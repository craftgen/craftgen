import { isEqual, isNil } from "lodash-es";
import { debounceTime, distinctUntilChanged, from, of, switchMap } from "rxjs";
import {
  ActorRefFrom,
  AnyActor,
  enqueueActions,
  fromObservable,
  setup,
  SnapshotFrom,
} from "xstate";

import { JSONSocket } from "./controls/socket-generator";
import { inputSocketMachine } from "./input-socket";

export const valueActorMachine = setup({
  types: {
    context: {} as {
      value: any | undefined; // Stores the current value
    },
    input: {} as {
      value?: any;
    },
    output: {} as {
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
  initial: "idle",
  states: {
    idle: {
      on: {
        SET_VALUE: {
          actions: enqueueActions(({ enqueue, event }) => {
            enqueue.assign({
              value: event.params.value,
            });
          }),
        },
      },
    },
  },
});

export const valueWatcher = fromObservable(
  ({
    input,
    system,
  }: {
    input: {
      self: AnyActor;
      definition: JSONSocket;
      parent: {
        id: string;
      };
    };
    system: any;
  }) => {
    if (isNil(input.self)) {
      console.log("No self", input.self);
      // throw new Error("No self");
      return of({});
    }

    const actor = system.get(input.self.id) as ActorRefFrom<
      typeof inputSocketMachine
    >;
    return from(actor).pipe(
      switchMap((state: SnapshotFrom<AnyActor>) => {
        return of(state.context.definition["x-key"] || {});
      }),
      debounceTime(150),
      distinctUntilChanged(isEqual),
    );
  },
);
