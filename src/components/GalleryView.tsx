import { Eye, EyeClosed, EyeOff, Star } from "lucide-react";
import type { Book } from "../features/books/types";
import { writeShelfBookDrag } from "../utils/shelfDrag";
import {
  BookActionsMenu,
  type BookActionsMenuHandlers,
} from "./BookActionsMenu";

type Props = {
  books: Book[];
  /** When dragging, if this book is selected in table view, move the whole selection */
  selectedIds: string[];
  folderOptions: { id: string; name: string }[];
  menuHandlers: BookActionsMenuHandlers;
  onOpenBook: (book: Book) => void;
  onCycleStatus: (book: Book) => void;
  onContextMenu: (event: React.MouseEvent, book: Book) => void;
};

export function GalleryView({
  books,
  selectedIds,
  folderOptions,
  menuHandlers,
  onOpenBook,
  onCycleStatus,
  onContextMenu,
}: Props) {
  return (
    <div className="shelf-scroll shelf-scroll-gutter h-full min-h-0 overflow-auto px-3 py-3 sm:px-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] items-start gap-3">
        {books.map((book) => {
          const status = book.status ?? "unread";

          const binderBorderClass =
            status === "reading"
              ? "border-amber-200/80 dark:border-amber-500/40"
              : status === "completed"
                ? "border-emerald-200/80 dark:border-emerald-500/40"
                : "border-stone-300/70 dark:border-stone-700";

          const binderSpineClass =
            status === "reading"
              ? "bg-amber-200/90 dark:bg-amber-400/70"
              : status === "completed"
                ? "bg-emerald-200/90 dark:bg-emerald-400/70"
                : "bg-stone-300/90 dark:bg-stone-600/80";

          return (
            <article
              key={book.id}
              draggable
              onDragStart={(event) => {
                const ids = selectedIds.includes(book.id)
                  ? selectedIds
                  : [book.id];
                writeShelfBookDrag(event.dataTransfer, ids);
              }}
              className="group relative flex h-[19rem] flex-col rounded-xl border border-stone-200 bg-stone-50 p-2 shadow-sm transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
              onClick={() => onOpenBook(book)}
              onContextMenu={(event) => onContextMenu(event, book)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") onOpenBook(book);
              }}
            >
              <button
                type="button"
                className={`absolute right-2 top-2 z-10 rounded-md border p-1 backdrop-blur transition hover:scale-[1.04] ${status === "reading"
                    ? "border-amber-200 bg-amber-50/90 text-amber-700 dark:border-amber-500/50 dark:bg-amber-400/10 dark:text-amber-300"
                    : status === "completed"
                      ? "border-emerald-200 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-400/10 dark:text-emerald-300"
                      : "border-stone-300 bg-stone-100/90 text-stone-600 dark:border-stone-700 dark:bg-stone-900/85 dark:text-stone-300"
                  }`}
                onClick={(event) => {
                  event.stopPropagation();
                  onCycleStatus(book);
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                }}
                aria-label={`Cycle reading status for ${book.title}`}
                title={`Status: ${status}. Click to cycle`}
              >
                {status === "unread" ? (
                  <EyeOff size={12} />
                ) : status === "reading" ? (
                  <Eye size={12} />
                ) : (
                  <EyeClosed size={12} />
                )}
              </button>
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={`${book.title} cover`}
                  className="h-44 w-full shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className={`relative h-44 w-full shrink-0 overflow-hidden rounded-lg border bg-[linear-gradient(145deg,#f5f5f4_0%,#e7e5e4_100%)] dark:bg-[linear-gradient(145deg,#292524_0%,#1c1917_100%)] ${binderBorderClass}`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 w-1 ${binderSpineClass}`}
                  />
                </div>
              )}
              <div className="mt-2 flex min-h-0 flex-1 flex-col">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {book.title}
                  </h3>
                  <p className="overflow-hidden text-xs leading-tight text-stone-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] dark:text-stone-300">
                    {book.author || "Unknown author"}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-1">
                  <div
                    className="flex shrink-0 items-center gap-0.5"
                    aria-label={
                      book.rating ? `Rated ${book.rating} of 5` : "Not rated"
                    }
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={13}
                        className={
                          (book.rating ?? 0) >= star
                            ? "fill-amber-400 text-amber-500"
                            : "text-stone-300 dark:text-stone-600"
                        }
                      />
                    ))}
                  </div>
                  <BookActionsMenu
                    book={book}
                    folderOptions={folderOptions}
                    handlers={menuHandlers}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
