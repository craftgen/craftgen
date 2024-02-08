import { isEqual } from "lodash-es";
import { from, of, switchMap } from "rxjs";
import { ActorSystem, AnyActor, SnapshotFrom, fromObservable } from "xstate";

export const socketWatcher = fromObservable(
  ({
    input,
    system,
  }: {
    input: {
      self: AnyActor;
    };
    system: ActorSystem<any>;
  }) => {
    const previousOutputs = new Map();
    const updateConnections = (state: SnapshotFrom<AnyActor>, key: string) => {
      const connections = state.context.outputSockets[key]["x-connection"];
      for (const [t, conn] of Object.entries(connections || {})) {
        const target = system.get(t);
        target.send({
          type: "SET_VALUE",
          params: {
            values: {
              [conn.key]: state.context.outputs[key],
            },
          },
        });
      }
    };

    return from(input.self as any).pipe(
      // Listen to snapshot events
      switchMap((state) => {
        const currentOutputs = state.context.outputs;
        const outputKeys = Object.keys(currentOutputs);

        // Iterate over each key to detect changes
        outputKeys.forEach((key) => {
          const currentValue = currentOutputs[key];
          const previousValue = previousOutputs.get(key);

          // If the value has changed, or if it's a new key
          if (!isEqual(currentValue, previousValue) || !previousValue) {
            // Update the map with the current value for future comparisons
            previousOutputs.set(key, currentValue);

            // Send a key-specific change event
            console.log("###", key, currentValue);
            updateConnections(state, key);
          }
        });

        // This just ensures the switchMap has something to emit, actual value here is not used
        return of(currentOutputs);
      }),
      // Optionally, act on the changes here or directly within the forEach loop above
    );
  },
);
