import type { BookDraft, QuickFilter } from "../features/books/types";
import type { CollectionStats } from "../features/books/repository";
import { BookForm } from "./BookForm";

type Props = {
  onSave: (payload: BookDraft) => Promise<void>;
  stats: CollectionStats;
  quickFilters: QuickFilter[];
  onToggleQuickFilter: (value: QuickFilter) => void;
  instantMode: boolean;
  setInstantMode: (value: boolean) => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkFavorite: () => Promise<void>;
  onBulkDonate: () => Promise<void>;
  onBulkAddCategory: (value: string) => Promise<void>;
  onBulkAddTag: (value: string) => Promise<void>;
  selectedCount: number;
  storageUsage: { used: number; quota: number; percent: number };
};

const QUICK_FILTERS: QuickFilter[] = [
  "favorites",
  "donate",
  "unread",
  "reading",
  "completed",
  "has-image",
  "missing-metadata",
];

function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function Sidebar(props: Props) {
  return (
    <aside className="flex h-full flex-col gap-3 overflow-y-auto border-r border-stone-200 bg-stone-100 p-3 dark:border-stone-800 dark:bg-stone-950">
      <BookForm
        onSave={props.onSave}
        instantMode={props.instantMode}
        setInstantMode={props.setInstantMode}
      />

      <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-800 dark:bg-stone-900">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
          Quick Filters
        </h3>
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
      </section>

      <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-800 dark:bg-stone-900">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
          Stats
        </h3>
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <dt>Total</dt>
          <dd>{props.stats.total}</dd>
          <dt>Favorites</dt>
          <dd>{props.stats.favorites}</dd>
          <dt>Donation</dt>
          <dd>{props.stats.donation}</dd>
          <dt>Reading</dt>
          <dd>{props.stats.reading}</dd>
          <dt>Completed</dt>
          <dd>{props.stats.completed}</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs dark:border-stone-800 dark:bg-stone-900">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
          Bulk Actions ({props.selectedCount})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            type="button"
            onClick={() => void props.onBulkFavorite()}
          >
            Favorite
          </button>
          <button
            className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            type="button"
            onClick={() => void props.onBulkDonate()}
          >
            Donate
          </button>
          <button
            className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            type="button"
            onClick={() => void props.onBulkDelete()}
          >
            Trash
          </button>
          <button
            className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            type="button"
            onClick={() => {
              const value = window.prompt("Category to add to selected books");
              if (value) void props.onBulkAddCategory(value);
            }}
          >
            Add Category
          </button>
          <button
            className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            type="button"
            onClick={() => {
              const value = window.prompt("Tag to add to selected books");
              if (value) void props.onBulkAddTag(value);
            }}
          >
            Add Tag
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs dark:border-stone-800 dark:bg-stone-900">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
          Backup
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={props.onExport}
            className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            Export JSON
          </button>
          <label className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800">
            Import JSON
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
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs dark:border-stone-800 dark:bg-stone-900">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
          Storage
        </h3>
        <p>
          {formatBytes(props.storageUsage.used)} /{" "}
          {formatBytes(props.storageUsage.quota)} ({props.storageUsage.percent}%
          used)
        </p>
        <div className="mt-2 h-2 rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className="h-2 rounded-full bg-stone-700 dark:bg-stone-300"
            style={{ width: `${Math.min(100, props.storageUsage.percent)}%` }}
          />
        </div>
      </section>
    </aside>
  );
}
