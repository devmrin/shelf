import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveFolderId, QuickFilter, SortMode, ViewMode } from '../features/books/types'

type UIState = {
  viewMode: ViewMode
  sortMode: SortMode
  sidebarOpen: boolean
  darkMode: 'light' | 'dark' | 'system'
  quickFilters: QuickFilter[]
  /** Taxonomy dropdown filters — OR semantics per type in queryBooks */
  selectedCategories: string[]
  selectedTags: string[]
  /** Main shelf folder scope */
  activeFolderId: ActiveFolderId
  columnVisibility: Record<string, boolean>
  setViewMode: (value: ViewMode) => void
  setSortMode: (value: SortMode) => void
  setSidebarOpen: (value: boolean) => void
  setDarkMode: (value: 'light' | 'dark' | 'system') => void
  toggleQuickFilter: (value: QuickFilter) => void
  setSelectedCategories: (value: string[]) => void
  setSelectedTags: (value: string[]) => void
  setActiveFolderId: (value: ActiveFolderId) => void
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
      selectedCategories: [],
      selectedTags: [],
      activeFolderId: 'uncategorized',
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
      setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
      setSelectedTags: (selectedTags) => set({ selectedTags }),
      setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
      setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
    }),
    {
      name: 'shelf-ui-state',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UIState>
        const raw = p.activeFolderId ?? current.activeFolderId
        const activeFolderId =
          (typeof raw === 'string' && raw === 'all' ? 'uncategorized' : raw) as ActiveFolderId
        return { ...current, ...p, activeFolderId }
      },
    },
  ),
)
