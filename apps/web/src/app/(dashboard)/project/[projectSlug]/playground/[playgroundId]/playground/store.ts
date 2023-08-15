import { useStore, useStore as useZustandStore } from "zustand";
import { StoreApi, createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";

import { DiContainer } from "./editor";
import type GridLayout from "react-grid-layout";
import { createContext, useContext } from "react";

export type ReteStore = {
  selectedNodeId: string | null;
  di: DiContainer | null;
  layout: GridLayout.Layout[];
  setLayout: (layout: GridLayout.Layout[]) => void;
  setDi: (di: DiContainer) => void;
  setSelectedNodeId: (selectedNodeId: string | null) => void;
};
export const store = createStore<
  ReteStore,
  [["zustand/subscribeWithSelector", never]]
>(
  subscribeWithSelector((set, get) => ({
    selectedNodeId: null,
    di: null,
    layout: [],
    setLayout: (layout: GridLayout.Layout[]) => set({ layout }),
    setDi: (di: DiContainer) => set({ di }),
    setSelectedNodeId: (selectedNodeId: string | null) =>
      set({ selectedNodeId }),
  }))
);
export const createCraftStore = (initial: Partial<ReteStore>) =>
  createStore<ReteStore, [["zustand/subscribeWithSelector", never]]>(
    subscribeWithSelector((set, get) => ({
      selectedNodeId: null,
      di: null,
      layout: [],
      setLayout: (layout: GridLayout.Layout[]) => set({ layout }),
      setDi: (di: DiContainer) => set({ di }),
      setSelectedNodeId: (selectedNodeId: string | null) =>
        set({ selectedNodeId }),
      ...initial,
    }))
  );

export type ReteStoreInstance = typeof store;
const createBoundedUseStore = ((store) => (selector, equals) =>
  useZustandStore(store, selector as never, equals)) as <
  S extends StoreApi<unknown>
>(
  store: S
) => {
  (): ExtractState<S>;
  <T>(
    selector: (state: ExtractState<S>) => T,
    equals?: (a: T, b: T) => boolean
  ): T;
};

type ExtractState<S> = S extends { getState: () => infer X } ? X : never;

// export const useStore = createBoundedUseStore(store);
export const CraftContext = createContext<ReteStoreInstance | null>(null);

export function useCraftStore<T>(
  selector: (state: ReteStore) => T,
  equalityFn?: (left: T, right: T) => boolean
): T {
  const store = useContext(CraftContext);
  if (!store) throw new Error("Missing CraftContext.Provider in the tree");
  return useStore(store, selector, equalityFn);
}
