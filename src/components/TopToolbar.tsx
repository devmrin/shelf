import {
  LayoutGrid,
  Table2,
  Search,
  Moon,
  Sun,
  Laptop2,
  Download,
  Upload,
  Trash2,
  Globe,
  ScanLine,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { QuickFilter, SortMode, ViewMode } from "../features/books/types";
import { FilterSelect } from "./FilterSelect";
import { SingleSelect } from "./SingleSelect";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryOptions: string[];
  tagOptions: string[];
  selectedCategory: string | undefined;
  selectedTag: string | undefined;
  onCategoryFilterChange: (value: string | undefined) => void;
  onTagFilterChange: (value: string | undefined) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  theme: "light" | "dark" | "system";
  onThemeChange: (mode: "light" | "dark" | "system") => void;
  quickFilters: QuickFilter[];
  onToggleQuickFilter: (value: QuickFilter) => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  trashedCount: number;
  onOpenTrash: () => void;
  folderScopeLabel?: string;
  onOpenWebSearch: () => void;
  onOpenScan?: () => void;
  showScanButton?: boolean;
};

const QUICK_FILTERS: QuickFilter[] = [
  "rated",
  "donate",
  "unread",
  "reading",
  "completed",
  "has-image",
  "missing-metadata",
];

export function TopToolbar(props: Props) {
  return (
    <Tooltip.Provider delayDuration={180}>
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
              placeholder="Search books, authors, categories, tags, publisher..."
              aria-label="Global book search"
            />
          </label>

          <div className="inline-flex items-center rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={props.onOpenWebSearch}
                  className="rounded-md p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
                  aria-label="Add book from web"
                >
                  <Globe size={14} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                  Add from web (Open Library)
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            {props.showScanButton && props.onOpenScan ? (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={props.onOpenScan}
                    className="rounded-md p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
                    aria-label="Scan ISBN barcode"
                  >
                    <ScanLine size={14} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                    Scan ISBN barcode
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ) : null}
          </div>

          <SingleSelect
            value={props.sortMode}
            onValueChange={(value) => props.onSortModeChange(value as SortMode)}
            ariaLabel="Sort books"
            triggerClassName="flex h-9 w-[12rem] items-center justify-between rounded-lg border border-stone-300 bg-stone-50 px-2 text-left text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            options={[
              { value: "created-desc", label: "Recently Added" },
              { value: "updated-desc", label: "Recently Updated" },
              { value: "title-asc", label: "Title A-Z" },
              { value: "author-asc", label: "Author A-Z" },
              { value: "rating-desc", label: "Rating" },
            ]}
          />

          <div className="inline-flex rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className={`rounded-md p-1 ${props.theme === "light" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
                  onClick={() => props.onThemeChange("light")}
                  aria-label="Light theme"
                >
                  <Sun size={14} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                  Light theme
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className={`rounded-md p-1 ${props.theme === "dark" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
                  onClick={() => props.onThemeChange("dark")}
                  aria-label="Dark theme"
                >
                  <Moon size={14} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                  Dark theme
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className={`rounded-md p-1 ${props.theme === "system" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
                  onClick={() => props.onThemeChange("system")}
                  aria-label="System theme"
                >
                  <Laptop2 size={14} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                  System theme
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <FilterSelect
              ariaLabel="Filter by category"
              allLabel="All categories"
              options={props.categoryOptions}
              value={props.selectedCategory}
              onValueChange={props.onCategoryFilterChange}
            />
            <FilterSelect
              ariaLabel="Filter by tag"
              allLabel="All tags"
              options={props.tagOptions}
              value={props.selectedTag}
              onValueChange={props.onTagFilterChange}
            />

            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => {
                const active = props.quickFilters.includes(filter);
                return (
                  <button
                    key={filter}
                    type="button"
                    className={`rounded-full px-2 py-1 text-xs ${active ? "bg-stone-800 text-stone-100 dark:bg-stone-100 dark:text-stone-900" : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-200"}`}
                    onClick={() => props.onToggleQuickFilter(filter)}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {props.trashedCount > 0 ? (
              <div className="inline-flex items-center rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      onClick={props.onOpenTrash}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-stone-200 dark:hover:bg-stone-800"
                      aria-label="Open trash"
                    >
                      <Trash2 size={14} />
                      <span>({props.trashedCount})</span>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                      Trash ({props.trashedCount})
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </div>
            ) : null}

            <div className="inline-flex items-center rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={props.onExport}
                    className="rounded-md p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
                    aria-label="Export JSON"
                  >
                    <Download size={14} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                    Export JSON
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <label
                    className="cursor-pointer rounded-md p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
                    aria-label="Import JSON"
                  >
                    <Upload size={14} />
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void props.onImport(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                    Import JSON
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>

            <div className="inline-flex rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className={`rounded-md px-2 py-1 text-xs ${props.viewMode === "gallery" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
                    onClick={() => props.onViewModeChange("gallery")}
                    aria-label="Switch to gallery view"
                  >
                    <LayoutGrid size={14} className="inline" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                    Gallery view
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className={`rounded-md px-2 py-1 text-xs ${props.viewMode === "table" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
                    onClick={() => props.onViewModeChange("table")}
                    aria-label="Switch to table view"
                  >
                    <Table2 size={14} className="inline" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
                    Table view
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </div>
        </div>

        {props.folderScopeLabel ? (
          <p className="mt-2 px-1 text-[11px] text-stone-600 dark:text-stone-400">
            {props.folderScopeLabel}
          </p>
        ) : null}
      </header>
    </Tooltip.Provider>
  );
}
