import { LayoutGrid, Table2, Search, Moon, Sun, Laptop2 } from "lucide-react";
import type { SortMode, ViewMode } from "../features/books/types";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  theme: "light" | "dark" | "system";
  onThemeChange: (mode: "light" | "dark" | "system") => void;
};

export function TopToolbar(props: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-stone-100/95 px-3 py-2 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[14rem] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={props.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            className="h-9 w-full rounded-lg border border-stone-300 bg-stone-50 pl-8 pr-2 text-sm outline-none ring-stone-400 placeholder:text-stone-400 focus:ring-2 dark:border-stone-700 dark:bg-stone-900"
            placeholder="Search title, author, tags, ISBN, notes..."
            aria-label="Global book search"
          />
        </label>

        <select
          className="h-9 rounded-lg border border-stone-300 bg-stone-50 px-2 text-sm dark:border-stone-700 dark:bg-stone-900"
          value={props.sortMode}
          onChange={(event) =>
            props.onSortModeChange(event.target.value as SortMode)
          }
          aria-label="Sort books"
        >
          <option value="created-desc">Recently Added</option>
          <option value="updated-desc">Recently Updated</option>
          <option value="title-asc">Title A-Z</option>
          <option value="author-asc">Author A-Z</option>
          <option value="rating-desc">Rating</option>
          <option value="favorites-first">Favorites First</option>
        </select>

        <div className="inline-flex rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-xs ${props.viewMode === "gallery" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
            onClick={() => props.onViewModeChange("gallery")}
            aria-label="Switch to gallery view"
          >
            <LayoutGrid size={14} className="inline" />
          </button>
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-xs ${props.viewMode === "table" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
            onClick={() => props.onViewModeChange("table")}
            aria-label="Switch to table view"
          >
            <Table2 size={14} className="inline" />
          </button>
        </div>

        <div className="inline-flex rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
          <button
            type="button"
            className={`rounded-md p-1 ${props.theme === "light" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
            onClick={() => props.onThemeChange("light")}
            aria-label="Light theme"
          >
            <Sun size={14} />
          </button>
          <button
            type="button"
            className={`rounded-md p-1 ${props.theme === "dark" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
            onClick={() => props.onThemeChange("dark")}
            aria-label="Dark theme"
          >
            <Moon size={14} />
          </button>
          <button
            type="button"
            className={`rounded-md p-1 ${props.theme === "system" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
            onClick={() => props.onThemeChange("system")}
            aria-label="System theme"
          >
            <Laptop2 size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
