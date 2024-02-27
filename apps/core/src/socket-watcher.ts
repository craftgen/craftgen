import { get, isEqual, isNil } from "lodash-es";
import {
  debounceTime,
  from,
  of,
  switchMap,
  filter,
  distinctUntilChanged,
} from "rxjs";
import { ActorSystem, AnyActor, SnapshotFrom, fromObservable } from "xstate";
import { JSONSocket } from "./controls/socket-generator";

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

      if (!connections) {
        return;
      }
      for (const [t, conn] of Object.entries(connections || {})) {
        console.log("Target", t, "Connection", conn);

        const target = system.get(t);
        if (!target) {
          // console.error("Target not found", t);
          continue;
        }
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
    if (isNil(input.self)) {
      console.log("No self", input.self);
      // throw new Error("No self");
      return of({});
    }

    const actor = system.get(input.self.id);
    const nodeEvents = from(actor);

    nodeEvents
      .pipe(
        filter((state) => {
          const moduleNode = system.get("editor");

          const parentId = get(state, ["context", "parent", "id"]);

          return moduleNode.id === parentId;
        }),
        debounceTime(1000),
        switchMap((state) => {
          const inputSockets = state.context.inputSockets as Record<
            string,
            JSONSocket
          >;

          const openInputs = Object.entries(inputSockets)
            .filter(([key, socket]) => {
              return socket["x-showSocket"];
            })
            .filter(([key, socket]) => {
              const connections = get(socket, ["x-connection"], {});
              if (Object.values(connections).length === 0) {
                return true;
              }
              return false;
            })
            .map(([key, socket]) => socket);

          const outputSockets = state.context.outputSockets as Record<
            string,
            JSONSocket
          >;
          const rootModuleId = system.get("editor").id;
          const openOutputs = Object.entries(outputSockets)
            .filter(([key, socket]) => {
              return socket["x-showSocket"];
            })
            .filter(([key, socket]) => {
              const connections = get(socket, ["x-connection"], {});
              const connectionKeys = Object.keys(connections).filter(
                (k) => k !== rootModuleId,
              );

              if (connectionKeys.length === 0) {
                return true;
              }

              return false;
            })
            .map(([key, socket]) => socket);

          return of({ openInputs, openOutputs });
        }),
        distinctUntilChanged(isEqual),
      )
      .subscribe((event) => {
        console.log("SET_INPUT_OUTPUT", event);
        const editorModule = system.get("editor");

        editorModule.send({
          type: "SET_INPUT_OUTPUT",
          params: {
            id: input.self.id,
            inputs: event.openInputs,
            outputs: event.openOutputs,
          },
        });
      });

    return nodeEvents.pipe(
      // Listen to snapshot events
      debounceTime(100),
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
        const outputSockets = state.context.outputSockets as Record<
          string,
          JSONSocket
        >;
        for (const key in outputSockets) {
          const connections = outputSockets[key]["x-connection"];
          if (connections) {
            for (const [t, conn] of Object.entries(connections)) {
              if (!connectionsMap.has(t)) {
                connectionsMap.set(t, new Set());
              }
              const target = system.get(t);
              if (!target) {
                // console.error("Target not found", t);
                continue;
              }
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
    );
  },
);
