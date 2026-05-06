import { create } from 'zustand'

type SelectionState = {
  selectedIds: string[]
  select: (id: string) => void
  unselect: (id: string) => void
  toggle: (id: string) => void
  clear: () => void
  setMany: (ids: string[]) => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],
  select: (id) =>
    set((state) =>
      state.selectedIds.includes(id)
        ? state
        : { selectedIds: [...state.selectedIds, id] },
    ),
  unselect: (id) =>
    set((state) => ({ selectedIds: state.selectedIds.filter((item) => item !== id) })),
  toggle: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((item) => item !== id)
        : [...state.selectedIds, id],
    })),
  clear: () => set({ selectedIds: [] }),
  setMany: (selectedIds) => set({ selectedIds }),
}))
