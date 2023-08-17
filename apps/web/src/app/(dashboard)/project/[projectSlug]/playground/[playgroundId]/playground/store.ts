import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";

import { DiContainer } from "./editor";
import type GridLayout from "react-grid-layout";
import { createContext, useContext } from "react";

export type ReteStore = {
  playgroundId: string;
  projectSlug: string;
  selectedNodeId: string | null;
  di: DiContainer | null;
  layout: GridLayout.Layout[];
  showControls: boolean;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
  toggleControls: () => void;
  setLayout: (layout: GridLayout.Layout[]) => void;
  setDi: (di: DiContainer) => void;
  setSelectedNodeId: (selectedNodeId: string | null) => void;
};
export const createCraftStore = (initial: Partial<ReteStore>) =>
  createStore<ReteStore, [["zustand/subscribeWithSelector", never]]>(
    subscribeWithSelector((set, get) => ({
      playgroundId: "",
      projectSlug: "",
      selectedNodeId: null,
      di: null,
      showControls: false,
      layout: [],
      position: { x: 0, y: 0 },
      setPosition: (position: { x: number; y: number }) => set({ position }),
      toggleControls: () =>
        set((state) => ({ showControls: !state.showControls })),
      setLayout: (layout: GridLayout.Layout[]) => set({ layout }),
      setDi: (di: DiContainer) => set({ di }),
      setSelectedNodeId: (selectedNodeId: string | null) =>
        set({ selectedNodeId }),
      ...initial,
    }))
  );
export type ReteStoreInstance = ReturnType<typeof createCraftStore>;

export const CraftContext = createContext<ReteStoreInstance | null>(null);

export function useCraftStore<T>(
  selector: (state: ReteStore) => T,
  equalityFn?: (left: T, right: T) => boolean
): T {
  const store = useContext(CraftContext);
  if (!store) throw new Error("Missing CraftContext.Provider in the tree");
  return useStore(store, selector, equalityFn);
}
