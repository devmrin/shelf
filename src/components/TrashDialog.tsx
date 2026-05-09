import * as Dialog from "@radix-ui/react-dialog";
import { RotateCcw, Trash2, X } from "lucide-react";
import type { Book } from "../features/books/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: Book[];
  onRestoreBook: (book: Book) => void;
  onDeleteBookForever: (book: Book) => void;
  onRestoreAll: () => void;
  onDeleteAllForever: () => void;
};

function formatDeletedTime(value?: number) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

export function TrashDialog({
  open,
  onOpenChange,
  books,
  onRestoreBook,
  onDeleteBookForever,
  onRestoreAll,
  onDeleteAllForever,
}: Props) {
  const hasBooks = books.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[fadeIn_140ms_ease-out]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] max-h-[85vh] w-[min(860px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-2xl outline-none dark:border-stone-700 dark:bg-stone-900 data-[state=open]:animate-[scaleIn_160ms_ease-out]">
          <div className="flex items-start justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-700 sm:px-5">
            <div>
              <Dialog.Title className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Trash ({books.length})
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-stone-600 dark:text-stone-300">
                Restore books back to your shelf or permanently delete them.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                aria-label="Close trash dialog"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {hasBooks ? (
            <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-2.5 dark:border-stone-700 sm:px-5">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                {books.length} deleted {books.length === 1 ? "book" : "books"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-200 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                  onClick={onRestoreAll}
                >
                  <RotateCcw size={13} />
                  Restore all
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
                  onClick={onDeleteAllForever}
                >
                  <Trash2 size={13} />
                  Delete all forever
                </button>
              </div>
            </div>
          ) : null}

          <div className="max-h-[60vh] overflow-y-auto px-4 py-3 sm:px-5">
            {!hasBooks ? (
              <div className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:text-stone-300">
                Trash is empty.
              </div>
            ) : (
              <ul className="space-y-2">
                {books.map((book) => (
                  <li
                    key={book.id}
                    className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-950/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                        {book.title}
                      </h3>
                      <p className="truncate text-xs text-stone-600 dark:text-stone-300">
                        {book.author || "Unknown author"}
                      </p>
                      <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                        Deleted: {formatDeletedTime(book.deletedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-200 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                        onClick={() => onRestoreBook(book)}
                      >
                        <RotateCcw size={13} />
                        Restore
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
                        onClick={() => onDeleteBookForever(book)}
                      >
                        <Trash2 size={13} />
                        Delete forever
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
