import { BookOpen, Check, Star } from "lucide-react";
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

/** Deterministic cover tint for books without a cover image. */
const SPINE_PALETTE = [
  ["#7f1d1d", "#991b1b"],
  ["#1e3a8a", "#1d4ed8"],
  ["#14532d", "#166534"],
  ["#78350f", "#92400e"],
  ["#3730a3", "#4338ca"],
  ["#134e4a", "#0f766e"],
  ["#581c87", "#6b21a8"],
  ["#7c2d12", "#9a3412"],
];

function pickPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SPINE_PALETTE[hash % SPINE_PALETTE.length];
}

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
    <div className="shelf-scroll shelf-scroll-gutter h-full min-h-0 overflow-auto px-4 py-5 sm:px-6">
      <div className="book3d-scene grid grid-cols-[repeat(auto-fill,minmax(155px,1fr))] items-start gap-x-6 gap-y-6">
        {books.map((book) => {
          const status = book.status ?? "unread";
          const [tintFrom, tintTo] = pickPalette(book.id || book.title);

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
              className="group relative flex flex-col"
              onClick={() => onOpenBook(book)}
              onContextMenu={(event) => onContextMenu(event, book)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") onOpenBook(book);
              }}
            >
              {/* Upright book with real page-stack depth */}
              <div className="relative mx-auto h-[210px] w-[140px]">
                <div
                  className={`book3d ${status === "reading" ? "is-reading" : ""}`}
                >
                  {/* Page block + underside, revealed when the cover swings open */}
                  <div className="book3d-pages" />
                  <div className="book3d-bottom" />

                  {/* Cover face */}
                  <div
                    className={`book3d-cover ${status === "completed" ? "opacity-90 grayscale-[40%]" : ""}`}
                    style={
                      book.coverImage
                        ? undefined
                        : {
                            backgroundImage: `linear-gradient(140deg, ${tintFrom} 0%, ${tintTo} 100%)`,
                          }
                    }
                  >
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={`${book.title} cover`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    ) : null}

                    <div className="book3d-spine" />

                    {/* Title / author shown only when there's no cover image */}
                    {!book.coverImage ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-2.5 pb-2.5 pt-7">
                        <h3 className="line-clamp-3 text-[12.5px] font-semibold leading-tight text-white drop-shadow">
                          {book.title}
                        </h3>
                        <p className="mt-0.5 line-clamp-1 text-[10.5px] font-medium text-white/70">
                          {book.author || "Unknown author"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="book3d-shadow" />
              </div>

              {/* Footer: rating + status + actions */}
              <div className="mx-auto mt-2 flex w-[140px] items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex shrink-0 items-center gap-0.5"
                    aria-label={
                      book.rating ? `Rated ${book.rating} of 5` : "Not rated"
                    }
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={
                          (book.rating ?? 0) >= star
                            ? "fill-amber-400 text-amber-500"
                            : "text-stone-300 dark:text-stone-600"
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className={`rounded-md border p-1 transition hover:scale-[1.05] ${
                      status === "reading"
                        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-400/10 dark:text-amber-300"
                        : status === "completed"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-400/10 dark:text-emerald-300"
                          : "border-stone-300 bg-stone-100 text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400"
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onCycleStatus(book);
                    }}
                    onDoubleClick={(event) => event.stopPropagation()}
                    aria-label={`Cycle reading status for ${book.title}`}
                    title={`Status: ${status}. Click to cycle`}
                  >
                    {status === "reading" ? (
                      <BookOpen size={12} />
                    ) : status === "completed" ? (
                      <Check size={12} />
                    ) : (
                      <BookOpen size={12} className="opacity-50" />
                    )}
                  </button>
                  <div onClick={(event) => event.stopPropagation()}>
                    <BookActionsMenu
                      book={book}
                      folderOptions={folderOptions}
                      handlers={menuHandlers}
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
