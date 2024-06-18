import { get, isEqual } from "lodash-es";
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  from,
  of,
  startWith,
  switchMap,
} from "rxjs";
import { match, P } from "ts-pattern";
import { AnyActor, fromObservable } from "xstate";

/**
 * Helper Actor for wathching other actors and
 * triggering event based on the input and  selector as input params.
 */
export const actorWatcher = fromObservable(
  ({
    input,
    system,
  }: {
    input: {
      actor: AnyActor;
      stateSelectorPath: string;
      event: string;
    };
    system: any;
  }) => {
    const actor = match(input.actor)
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

    const initialSnapshotSubject = new BehaviorSubject(actor.getSnapshot());

    const eventStream = from(actor).pipe(
      startWith(initialSnapshotSubject.value), // Start with the snapshot
      switchMap((state) => {
        return of(get(state, input.stateSelectorPath));
      }),
      debounceTime(1000),
      distinctUntilChanged(isEqual),
    );

    eventStream.subscribe((inputs) => {
      // console.log("Actor inputs", inputs);
      // console.log("Actor event", {
      //   type: input.event,
      //   params: { inputs },
      // });
      actor.send({
        type: input.event,
        params: { inputs },
      });
    });
    return eventStream;
  },
);
