import { createContext, useContext } from "react";
import { useStore } from "zustand";

import type { ReteStore, ReteStoreInstance } from "./store";

export const CraftContext = createContext<ReteStoreInstance | null>(null);

export function useCraftStore<T>(
  selector: (state: ReteStore) => T,
  equalityFn?: (left: T, right: T) => boolean,
): T {
  const store = useContext(CraftContext);
  if (!store) throw new Error("Missing CraftContext.Provider in the tree");
  return useStore(store, selector, equalityFn);
}
