import { useState } from "react";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import type { ActiveFolderId, Folder } from "../features/books/types";
import type { FolderWithCounts } from "../features/books/repository";
import { readShelfBookDrag } from "../utils/shelfDrag";
import { cn } from "../utils/cn";

type Props = {
  folders: FolderWithCounts[];
  uncategorizedCount: number;
  activeFolderId: ActiveFolderId;
  onSelectFolder: (id: ActiveFolderId) => void;
  onCreateFolder: (name: string) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onRequestDeleteFolder: (folder: Folder) => void;
  onMoveBooksToFolder: (folderId: string | null, bookIds: string[]) => Promise<void>;
};

function scopeFromRowId(rowId: string): ActiveFolderId | null {
  if (rowId === "uncategorized") return rowId;
  return rowId;
}

export function FolderNav(props: Props) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await props.onCreateFolder(trimmed);
      setNewName("");
    } finally {
      setCreating(false);
    }
  };

  const handleDrop = async (rowKey: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverKey(null);
    const ids = readShelfBookDrag(e.dataTransfer);
    if (!ids.length) return;

    if (rowKey === "uncategorized") {
      await props.onMoveBooksToFolder(null, ids);
      return;
    }
    await props.onMoveBooksToFolder(rowKey, ids);
  };

  const rowClass = (rowKey: string, isActive: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition",
      isActive
        ? "bg-stone-200 font-medium text-stone-900 dark:bg-stone-800 dark:text-stone-100"
        : "text-stone-700 hover:bg-stone-200/80 dark:text-stone-200 dark:hover:bg-stone-800/80",
      dragOverKey === rowKey &&
        "ring-2 ring-amber-400/80 ring-offset-1 ring-offset-stone-100 dark:ring-offset-stone-950",
    );

  const renderRow = (
    rowKey: string,
    label: string,
    count: number,
    options: { droppable: boolean; showFolderActions?: Folder },
  ) => {
    const scope = scopeFromRowId(rowKey);
    const isActive =
      scope !== null && props.activeFolderId === scope;

    return (
      <div
        key={rowKey}
        className={rowClass(rowKey, isActive)}
        onDragOver={
          options.droppable
            ? (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }
            : undefined
        }
        onDragEnter={
          options.droppable
            ? (e) => {
                e.preventDefault();
                setDragOverKey(rowKey);
              }
            : undefined
        }
        onDragLeave={
          options.droppable
            ? () => setDragOverKey((k) => (k === rowKey ? null : k))
            : undefined
        }
        onDrop={
          options.droppable ? (e) => void handleDrop(rowKey, e) : undefined
        }
      >
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left"
          onClick={() => {
            const s = scopeFromRowId(rowKey);
            if (s !== null) props.onSelectFolder(s);
          }}
        >
          <span>{label}</span>
          <span className="ml-1 tabular-nums text-stone-500 dark:text-stone-400">
            ({count})
          </span>
        </button>
        {options.showFolderActions ? (
          <span className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className="rounded p-1 text-stone-500 hover:bg-stone-300/80 hover:text-stone-800 dark:hover:bg-stone-700 dark:hover:text-stone-100"
              aria-label={`Rename folder ${options.showFolderActions.name}`}
              onClick={(event) => {
                event.stopPropagation();
                const name = window.prompt(
                  "Folder name",
                  options.showFolderActions?.name ?? "",
                );
                if (!name?.trim()) return;
                void props.onRenameFolder(
                  options.showFolderActions!.id,
                  name.trim(),
                );
              }}
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              className="rounded p-1 text-stone-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-300"
              aria-label={`Delete folder ${options.showFolderActions.name}`}
              onClick={(event) => {
                event.stopPropagation();
                props.onRequestDeleteFolder(options.showFolderActions!);
              }}
            >
              <Trash2 size={12} />
            </button>
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-800 dark:bg-stone-900">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
        <FolderOpen size={14} className="shrink-0" />
        Folders
      </h3>

      <div className="flex flex-col gap-0.5">
        {renderRow("uncategorized", "Uncategorized", props.uncategorizedCount, {
          droppable: true,
        })}
        {props.folders.map((folder) =>
          renderRow(folder.id, folder.name, folder.bookCount, {
            droppable: true,
            showFolderActions: folder,
          }),
        )}
      </div>

      <div className="mt-3 flex gap-1">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleCreate();
          }}
          placeholder="New folder name"
          className="h-8 min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-950"
          aria-label="New folder name"
        />
        <button
          type="button"
          disabled={creating || !newName.trim()}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-stone-300 bg-stone-100 px-2 text-xs font-medium hover:bg-stone-200 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
          onClick={() => void handleCreate()}
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </section>
  );
}
