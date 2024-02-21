import { useCallback, useState } from "react";

export type MapOrEntries<K, V> = Map<K, V> | [K, V][];

// Public interface
export interface Registry<K, V> {
  has: (key: K) => boolean;
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  setAll: (entries: MapOrEntries<K, V>) => void;
  remove: (key: K) => void;
  reset: Map<K, V>["clear"];
  entries: () => IterableIterator<[K, V]>;
}

// We hide some setters from the returned map to disable autocompletion
// export type Registry<K, V> = Omit<Map<K, V>, "set" | "clear">;

type Return<K, V> = [
  Omit<Map<K, V>, "set" | "clear" | "delete">,
  Registry<K, V>,
];

export function useRegistry<K, V>(
  initialState: MapOrEntries<K, V> = new Map(),
): Return<K, V> {
  const [map, setMap] = useState(new Map(initialState));

  const actions: Registry<K, V> = {
    has: useCallback((key: K) => map.has(key), []),
    get: useCallback((key: K) => map.get(key), []),
    entries: useCallback(() => map.entries(), []),

    set: useCallback((key: K, value: V) => {
      setMap((prev) => {
        const copy = new Map(prev);
        copy.set(key, value);
        return copy;
      });
    }, []),

    setAll: useCallback((entries) => {
      setMap(() => new Map(entries));
    }, []),

    remove: useCallback((key) => {
      setMap((prev) => {
        const copy = new Map(prev);
        copy.delete(key);
        return copy;
      });
    }, []),

    reset: useCallback(() => {
      setMap(() => new Map());
    }, []),
  };

  return [map, actions];
}
