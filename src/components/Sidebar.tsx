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
};

export function Sidebar(props: Props) {
  return (
    <aside className="flex h-full flex-col gap-3 overflow-y-auto border-r border-stone-200 bg-stone-100 p-3 dark:border-stone-800 dark:bg-stone-950">
      <BookForm
        key={props.editingBook?.id ?? "new-book"}
        onSave={props.onSave}
        editingBook={props.editingBook}
        onCancelEdit={props.onCancelEdit}
        preferredFolderId={props.preferredFolderId}
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
          <dt>Favorites</dt>
          <dd className="text-right tabular-nums">{props.stats.favorites}</dd>
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
