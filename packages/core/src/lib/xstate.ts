import type { AnyMachineSnapshot } from "xstate";

export function getNextEvents(snapshot: AnyMachineSnapshot) {
  return [...new Set([...snapshot._nodes.flatMap((sn) => sn.ownEvents)])];
}
