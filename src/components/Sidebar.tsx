import {
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Laptop2,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type {
  ActiveFolderId,
  Book,
  BookDraft,
  Folder,
} from "../features/books/types";
import type {
  CollectionStats,
  FolderWithCounts,
} from "../features/books/repository";
import { BookForm } from "./BookForm";
import { FolderNav } from "./FolderNav";

type Props = {
  onSave: (payload: BookDraft) => Promise<void>;
  stats: CollectionStats;
  editingBook?: Book;
  onCancelEdit?: () => void;
  preferredFolderId?: string;
  prefill?: BookDraft;
  onResetForm?: () => void;
  folders: FolderWithCounts[];
  uncategorizedCount: number;
  activeFolderId: ActiveFolderId;
  onSelectFolder: (id: ActiveFolderId) => void;
  onCreateFolder: (name: string) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onRequestDeleteFolder: (folder: Folder) => void;
  onMoveBooksToFolder: (
    folderId: string | null,
    bookIds: string[],
  ) => Promise<void>;
  /** Desktop-only collapse controls. Omit on mobile. */
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  theme?: "light" | "dark" | "system";
  onThemeChange?: (mode: "light" | "dark" | "system") => void;
};

type Theme = "light" | "dark" | "system";

const THEME_ORDER: Theme[] = ["light", "dark", "system"];

const THEME_META: Record<
  Theme,
  { label: string; icon: React.ComponentType<{ size?: number }> }
> = {
  light: { label: "Light theme", icon: Sun },
  dark: { label: "Dark theme", icon: Moon },
  system: { label: "System theme", icon: Laptop2 },
};

function cycleTheme(theme: Theme): Theme {
  const next = (THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length;
  return THEME_ORDER[next];
}

function ThemeCycleButton({
  theme,
  onThemeChange,
}: {
  theme: Theme;
  onThemeChange: (mode: Theme) => void;
}) {
  const meta = THEME_META[theme];
  const Icon = meta.icon;
  return (
    <Tooltip.Root delayDuration={150}>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          onClick={() => onThemeChange(cycleTheme(theme))}
          aria-label={`${meta.label} — click to change`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-50"
        >
          <Icon size={18} />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={6}
          className="z-50 rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow-md dark:bg-stone-100 dark:text-stone-900"
        >
          {meta.label} — click to change
          <Tooltip.Arrow className="fill-stone-900 dark:fill-stone-100" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function Sidebar(props: Props) {
  if (props.collapsible && props.collapsed) {
    return (
      <Tooltip.Provider>
        <aside className="flex h-full w-full flex-col items-center gap-2 border-r border-stone-200 bg-stone-100 py-3 dark:border-stone-800 dark:bg-stone-950">
          <Tooltip.Root delayDuration={150}>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={() => props.onToggleCollapsed?.()}
                aria-label="Expand sidebar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-50"
              >
                <PanelLeftOpen size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="right"
                sideOffset={6}
                className="z-50 rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow-md dark:bg-stone-100 dark:text-stone-900"
              >
                Expand sidebar
                <Tooltip.Arrow className="fill-stone-900 dark:fill-stone-100" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          {props.theme && props.onThemeChange ? (
            <div className="mt-auto pb-1">
              <ThemeCycleButton
                theme={props.theme}
                onThemeChange={props.onThemeChange}
              />
            </div>
          ) : null}
        </aside>
      </Tooltip.Provider>
    );
  }

  return (
    <aside className="shelf-scroll shelf-scroll-gutter flex h-full flex-col gap-3 overflow-y-auto border-r border-stone-200 bg-stone-100 p-3 dark:border-stone-800 dark:bg-stone-950">
      {props.collapsible ? (
        <Tooltip.Provider>
          <div className="flex items-center justify-between">
            {props.theme && props.onThemeChange ? (
              <ThemeCycleButton
                theme={props.theme}
                onThemeChange={props.onThemeChange}
              />
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => props.onToggleCollapsed?.()}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-50"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
        </Tooltip.Provider>
      ) : null}

      <BookForm
        key={
          props.editingBook?.id ??
          (props.prefill
            ? `prefill-${props.prefill.title}-${props.prefill.isbn ?? ""}`
            : "new-book")
        }
        onSave={props.onSave}
        editingBook={props.editingBook}
        onCancelEdit={props.onCancelEdit}
        preferredFolderId={props.preferredFolderId}
        prefill={props.prefill}
        onReset={props.onResetForm}
      />

      <FolderNav
        folders={props.folders}
        uncategorizedCount={props.uncategorizedCount}
        activeFolderId={props.activeFolderId}
        onSelectFolder={props.onSelectFolder}
        onCreateFolder={props.onCreateFolder}
        onRenameFolder={props.onRenameFolder}
        onRequestDeleteFolder={props.onRequestDeleteFolder}
        onMoveBooksToFolder={props.onMoveBooksToFolder}
      />

      <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-800 dark:bg-stone-900">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
          Stats
        </h3>
        <dl className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-xs">
          <dt>Total</dt>
          <dd className="text-right tabular-nums">{props.stats.total}</dd>
          <dt>Rated</dt>
          <dd className="text-right tabular-nums">{props.stats.rated}</dd>
          <dt>Donation</dt>
          <dd className="text-right tabular-nums">{props.stats.donation}</dd>
          <dt>Reading</dt>
          <dd className="text-right tabular-nums">{props.stats.reading}</dd>
          <dt>Completed</dt>
          <dd className="text-right tabular-nums">{props.stats.completed}</dd>
        </dl>
      </section>
    </aside>
  );
}
