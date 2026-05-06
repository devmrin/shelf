import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QuickFilter, SortMode, ViewMode } from '../features/books/types'

type UIState = {
  viewMode: ViewMode
  sortMode: SortMode
  sidebarOpen: boolean
  darkMode: 'light' | 'dark' | 'system'
  quickFilters: QuickFilter[]
  columnVisibility: Record<string, boolean>
  setViewMode: (value: ViewMode) => void
  setSortMode: (value: SortMode) => void
  setSidebarOpen: (value: boolean) => void
  setDarkMode: (value: 'light' | 'dark' | 'system') => void
  toggleQuickFilter: (value: QuickFilter) => void
  setColumnVisibility: (value: Record<string, boolean>) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      viewMode: 'gallery',
      sortMode: 'created-desc',
      sidebarOpen: true,
      darkMode: 'system',
      quickFilters: [],
      columnVisibility: {},
      setViewMode: (viewMode) => set({ viewMode }),
      setSortMode: (sortMode) => set({ sortMode }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setDarkMode: (darkMode) => set({ darkMode }),
      toggleQuickFilter: (value) =>
        set((state) => ({
          quickFilters: state.quickFilters.includes(value)
            ? state.quickFilters.filter((item) => item !== value)
            : [...state.quickFilters, value],
        })),
      setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
    }),
    { name: 'shelf-ui-state' },
  ),
)
