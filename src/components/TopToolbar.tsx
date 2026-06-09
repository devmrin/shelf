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
  Menu,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
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
  isMobile?: boolean;
  onOpenSidebar?: () => void;
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

const SORT_OPTIONS = [
  { value: "created-desc", label: "Recently Added" },
  { value: "updated-desc", label: "Recently Updated" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "author-asc", label: "Author A-Z" },
  { value: "rating-desc", label: "Rating" },
];

const segmentClassName =
  "inline-flex items-center rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900";
const iconButtonClassName =
  "rounded-md p-1 hover:bg-stone-200 dark:hover:bg-stone-800";

function TooltipIcon({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="z-[100] rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow dark:bg-stone-100 dark:text-stone-900">
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function SourceButtons(props: Props) {
  return (
    <div className={segmentClassName}>
      <TooltipIcon label="Add from web (Open Library)">
        <button
          type="button"
          onClick={props.onOpenWebSearch}
          className={iconButtonClassName}
          aria-label="Add book from web"
        >
          <Globe size={14} />
        </button>
      </TooltipIcon>

      {props.showScanButton && props.onOpenScan ? (
        <TooltipIcon label="Scan ISBN barcode">
          <button
            type="button"
            onClick={props.onOpenScan}
            className={iconButtonClassName}
            aria-label="Scan ISBN barcode"
          >
            <ScanLine size={14} />
          </button>
        </TooltipIcon>
      ) : null}
    </div>
  );
}

function ThemeButtons(props: Props) {
  return (
    <div className={segmentClassName}>
      <TooltipIcon label="Light theme">
        <button
          type="button"
          className={`rounded-md p-1 ${props.theme === "light" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
          onClick={() => props.onThemeChange("light")}
          aria-label="Light theme"
        >
          <Sun size={14} />
        </button>
      </TooltipIcon>
      <TooltipIcon label="Dark theme">
        <button
          type="button"
          className={`rounded-md p-1 ${props.theme === "dark" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
          onClick={() => props.onThemeChange("dark")}
          aria-label="Dark theme"
        >
          <Moon size={14} />
        </button>
      </TooltipIcon>
      <TooltipIcon label="System theme">
        <button
          type="button"
          className={`rounded-md p-1 ${props.theme === "system" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
          onClick={() => props.onThemeChange("system")}
          aria-label="System theme"
        >
          <Laptop2 size={14} />
        </button>
      </TooltipIcon>
    </div>
  );
}

function DataButtons(props: Props) {
  return (
    <>
      {props.trashedCount > 0 ? (
        <div className={segmentClassName}>
          <TooltipIcon label={`Trash (${props.trashedCount})`}>
            <button
              type="button"
              onClick={props.onOpenTrash}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-stone-200 dark:hover:bg-stone-800"
              aria-label="Open trash"
            >
              <Trash2 size={14} />
              <span>({props.trashedCount})</span>
            </button>
          </TooltipIcon>
        </div>
      ) : null}

      <div className={segmentClassName}>
        <TooltipIcon label="Export JSON">
          <button
            type="button"
            onClick={props.onExport}
            className={iconButtonClassName}
            aria-label="Export JSON"
          >
            <Download size={14} />
          </button>
        </TooltipIcon>

        <TooltipIcon label="Import JSON">
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
        </TooltipIcon>
      </div>
    </>
  );
}

function ViewButtons(props: Props) {
  return (
    <div className="inline-flex rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
      <TooltipIcon label="Gallery view">
        <button
          type="button"
          className={`rounded-md px-2 py-1 text-xs ${props.viewMode === "gallery" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
          onClick={() => props.onViewModeChange("gallery")}
          aria-label="Switch to gallery view"
        >
          <LayoutGrid size={14} className="inline" />
        </button>
      </TooltipIcon>
      <TooltipIcon label="Table view">
        <button
          type="button"
          className={`rounded-md px-2 py-1 text-xs ${props.viewMode === "table" ? "bg-stone-200 dark:bg-stone-800" : ""}`}
          onClick={() => props.onViewModeChange("table")}
          aria-label="Switch to table view"
        >
          <Table2 size={14} className="inline" />
        </button>
      </TooltipIcon>
    </div>
  );
}

function QuickFilterChips(props: Props) {
  return (
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
  );
}

function SearchInput(props: Props) {
  return (
    <label className="relative min-w-0 flex-1">
      <Search
        size={14}
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-stone-400"
      />
      <input
        value={props.search}
        onChange={(event) => props.onSearchChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-stone-300 bg-stone-50 pl-8 pr-2 text-sm outline-none ring-stone-400 placeholder:text-stone-400 focus:ring-2 dark:border-stone-700 dark:bg-stone-900"
        placeholder="Search books, authors, categories, tags…"
        aria-label="Global book search"
      />
    </label>
  );
}

export function TopToolbar(props: Props) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeFilterCount =
    props.quickFilters.length +
    (props.selectedCategory ? 1 : 0) +
    (props.selectedTag ? 1 : 0);

  if (props.isMobile) {
    return (
      <Tooltip.Provider delayDuration={180}>
        <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-stone-100/95 px-3 py-2 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={props.onOpenSidebar}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-stone-50 dark:border-stone-700 dark:bg-stone-900"
              aria-label="Open sidebar"
            >
              <Menu size={16} />
            </button>

            <SearchInput {...props} />

            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-300 ${panelOpen ? "bg-stone-800 text-stone-100 dark:bg-stone-100 dark:text-stone-900" : "bg-stone-50 dark:bg-stone-900"} dark:border-stone-700`}
              aria-label="Filters and view options"
              aria-expanded={panelOpen}
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {panelOpen ? (
              <motion.div
                key="filter-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-col gap-3 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                      Sort & filter
                    </span>
                    <button
                      type="button"
                      onClick={() => setPanelOpen(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-stone-200 dark:hover:bg-stone-800"
                      aria-label="Close panel"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <SingleSelect
                    value={props.sortMode}
                    onValueChange={(value) =>
                      props.onSortModeChange(value as SortMode)
                    }
                    ariaLabel="Sort books"
                    triggerClassName="flex h-9 w-full items-center justify-between rounded-lg border border-stone-300 bg-stone-50 px-2 text-left text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                    options={SORT_OPTIONS}
                  />

                  <div className="grid grid-cols-2 gap-2">
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
                  </div>

                  <QuickFilterChips {...props} />

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
                    <ViewButtons {...props} />
                    <div className="flex items-center gap-2">
                      <SourceButtons {...props} />
                      <DataButtons {...props} />
                      <ThemeButtons {...props} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {props.folderScopeLabel ? (
            <p className="mt-2 px-1 text-[11px] text-stone-600 dark:text-stone-400">
              {props.folderScopeLabel}
            </p>
          ) : null}
        </header>
      </Tooltip.Provider>
    );
  }

  return (
    <Tooltip.Provider delayDuration={180}>
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-stone-100/95 px-3 py-2 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex min-w-[14rem] flex-1">
            <SearchInput {...props} />
          </div>

          <SourceButtons {...props} />

          <SingleSelect
            value={props.sortMode}
            onValueChange={(value) => props.onSortModeChange(value as SortMode)}
            ariaLabel="Sort books"
            triggerClassName="flex h-9 w-[12rem] items-center justify-between rounded-lg border border-stone-300 bg-stone-50 px-2 text-left text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            options={SORT_OPTIONS}
          />
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

            <QuickFilterChips {...props} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <DataButtons {...props} />
            <ViewButtons {...props} />
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
