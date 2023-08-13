import { create } from 'zustand'
import { DiContainer } from './editor'

type Store = {
  di: DiContainer | null
  setDi: (di: DiContainer) => void
}

export const useStore = create<Store>((set, get) => ({
  di: null,
  setDi: (di: DiContainer) => set({ di }),
}))