import { get, isEqual, omit } from "lodash-es";
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import { match, P } from "ts-pattern";
import { ActorRefFrom, AnyActor, fromObservable, SnapshotFrom } from "xstate";

import { inputSocketMachine } from "./input-socket";
import { createJsonSchema } from "./utils";

export const inputJsonWatcher = fromObservable(
  ({
    input,
    system,
  }: {
    input: {
      actor: any;
      triggerSocket: any;
    };
    system: any;
  }) => {
    // console.log("LISTENING Actor INPUTS", input);
    const actor: AnyActor = match(input.actor)
      .with(
        {
          src: P.string,
        },
        (value) => {
          return value as AnyActor;
        },
      )
      .with(
        {
          id: P.string,
        },
        (value) => {
          return system.get(value.id);
        },
      )
      .run();

    const triggerSocket: ActorRefFrom<typeof inputSocketMachine> = match(
      input.triggerSocket,
    )
      .with(
        {
          src: P.string,
        },
        (value) => {
          return value;
        },
      )
      .with(
        {
          id: P.string,
        },
        (value) => {
          return system.get(value.id);
        },
      )
      .run();

    const inputSockets = new BehaviorSubject(actor.getSnapshot());

    const inputObservables = from(actor).pipe(
      startWith(inputSockets.value), // Start with the snapshot { a: xstateActor , b: xstateActor }
      switchMap((state) =>
        of(omit(state.context.inputSockets, [triggerSocket.id])),
      ),
      distinctUntilChanged(isEqual),
      debounceTime(100),
      tap((inputSockets) => {
        // console.log("Input Sockets", inputSockets);
      }),
      switchMap(
        (
          inputSockets: Record<string, ActorRefFrom<typeof inputSocketMachine>>,
        ) => {
          // console.log("Input Sockets changed", inputSockets);
          // Create an object of observables from xstateActorRefs

          const observablesFromActors = Object.keys(inputSockets).reduce(
            (acc, key) => {
              const initialSnapshotSubject = new BehaviorSubject(
                inputSockets[key].getSnapshot(),
              );
              acc[key] = from(inputSockets[key]).pipe(
                startWith(initialSnapshotSubject.value), // Start with the snapshot
                map((state) => state.context.definition),
                distinctUntilChanged(isEqual),
              );
              return acc;
            },
            {},
          );

          // Combine the latest values using combineLatest
          const latestCombination = combineLatest(observablesFromActors).pipe(
            // debounceTime(1000),
            tap((combinedValues) => {
              // console.log("Combined values", combinedValues);
            }),
            distinctUntilChanged(isEqual),
            map((combinedValues) => {
              const filteredValues = Object.keys(combinedValues).reduce(
                (acc, key) => {
                  if (get(combinedValues, [key, "x-showSocket"])) {
                    const inputKey = get(combinedValues, [key, "x-key"]);
                    // Check if property exists and is truthy
                    acc[inputKey] = combinedValues[key];
                  }
                  return acc;
                },
                {},
              );
              // Transform the combinedValues into your desired JSON object format
              // ... your transformation logic here
              return createJsonSchema(filteredValues);
            }),
          );

          return latestCombination;
        },
      ),
      tap((inputValues) => {
        // console.log("Input values", inputValues);
      }),
    );

    inputObservables.subscribe((inputSchema) => {
      triggerSocket.send({
        type: "UPDATE_SOCKET",
        params: {
          schema: inputSchema,
        },
      });
    });

    // Subscribe to the final observable
    return inputObservables;
  },
);
