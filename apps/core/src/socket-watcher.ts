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
    type ActorId = string;
    const connectionsMap = new Map<ActorId, Set<string>>();
    const updateConnections = (state: SnapshotFrom<AnyActor>, key: string) => {
      const connections = state.context.outputSockets[key]["x-connection"];
      console.log("connections", connections);
      for (const [t, conn] of Object.entries(connections || {})) {
        console.log("Target", t, "Connection", conn);
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
            updateConnections(state, key);
          }
        });

        // Handle if there's a new connection added to any of the outputSockets and updateConnections for that key
        const outputSockets = state.context.outputSockets;
        for (const key in outputSockets) {
          const connections = outputSockets[key]["x-connection"];
          if (connections) {
            for (const [t, conn] of Object.entries(connections)) {
              if (!connectionsMap.has(t)) {
                connectionsMap.set(t, new Set());
              }
              const target = system.get(t);
              if (!connectionsMap.get(t)!.has(key)) {
                connectionsMap.get(t)!.add(key);
                target.send({
                  type: "SET_VALUE",
                  params: {
                    values: {
                      [conn.key]: state.context.outputs[key],
                    },
                  },
                });
              }
            }
          }
        }

        // This just ensures the switchMap has something to emit, actual value here is not used
        return of(currentOutputs);
      }),
      // Optionally, act on the changes here or directly within the forEach loop above
    );
  },
);
