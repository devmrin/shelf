import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Heart, HandCoins } from "lucide-react";
import type { Book } from "../features/books/types";

type Props = {
  books: Book[];
  onOpenBook: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  onContextMenu: (event: React.MouseEvent, book: Book) => void;
};

const CARD_HEIGHT = 280;

export function GalleryView({
  books,
  onOpenBook,
  onToggleFavorite,
  onContextMenu,
}: Props) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const count = books.length;

  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT,
    overscan: 8,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const contentHeight = rowVirtualizer.getTotalSize();
  const indexed = useMemo(
    () => books.map((book, index) => ({ book, index })),
    [books],
  );

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-7.5rem)] overflow-auto px-3 py-3 sm:px-4"
    >
      <div style={{ height: contentHeight, position: "relative" }}>
        {virtualItems.map((item) => {
          const book = indexed[item.index]?.book;
          if (!book) return null;

          return (
            <article
              key={book.id}
              className="group absolute left-0 right-0 rounded-xl border border-stone-200 bg-stone-50 p-2 shadow-sm transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
              style={{ transform: `translateY(${item.start}px)` }}
              onClick={() => onOpenBook(book)}
              onDoubleClick={() => onToggleFavorite(book)}
              onContextMenu={(event) => onContextMenu(event, book)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") onOpenBook(book);
              }}
            >
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={`${book.title} cover`}
                  className="aspect-[3/4] h-40 w-full rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-[3/4] h-40 w-full items-center justify-center rounded-lg bg-stone-200 text-xs text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                  No cover
                </div>
              )}
              <div className="mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {book.title}
                  </h3>
                  <p className="truncate text-xs text-stone-600 dark:text-stone-300">
                    {book.author || "Unknown author"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {book.readyToDonate ? (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700 dark:bg-red-950/60 dark:text-red-300">
                      <HandCoins size={10} className="mr-1 inline" /> Donate
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-md p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleFavorite(book);
                    }}
                    aria-label={`Toggle favorite for ${book.title}`}
                  >
                    <Heart
                      size={14}
                      className={
                        book.isFavorite
                          ? "fill-amber-400 text-amber-500"
                          : "text-stone-400"
                      }
                    />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[11px] capitalize text-stone-500 dark:text-stone-400">
                {book.status ?? "unread"}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
