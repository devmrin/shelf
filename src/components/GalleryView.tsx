import { HandCoins, Heart, Pencil, Trash2 } from "lucide-react";
import type { Book } from "../features/books/types";

type Props = {
  books: Book[];
  onOpenBook: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  onToggleDonate: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
  onContextMenu: (event: React.MouseEvent, book: Book) => void;
};

export function GalleryView({
  books,
  onOpenBook,
  onToggleFavorite,
  onToggleDonate,
  onEditBook,
  onDeleteBook,
  onContextMenu,
}: Props) {
  return (
    <div className="h-full min-h-0 overflow-auto px-3 py-3 sm:px-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-3">
        {books.map((book) => (
          <article
            key={book.id}
            className="group rounded-xl border border-stone-200 bg-stone-50 p-2 shadow-sm transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
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
                className="aspect-[3/4] h-32 w-full rounded-lg object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className={`relative flex aspect-[3/4] h-32 w-full flex-col justify-between overflow-hidden rounded-lg border bg-[linear-gradient(145deg,#f5f5f4_0%,#e7e5e4_100%)] p-2 dark:bg-[linear-gradient(145deg,#292524_0%,#1c1917_100%)] ${
                  book.status === "completed"
                    ? "border-amber-200/80 dark:border-amber-500/40"
                    : "border-stone-300/70 dark:border-stone-700"
                }`}
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${
                    book.status === "completed"
                      ? "bg-amber-200/90 dark:bg-amber-400/70"
                      : "bg-stone-300/90 dark:bg-stone-600/80"
                  }`}
                />
                <p className="line-clamp-3 pl-2 pr-1 text-[11px] font-semibold leading-tight text-stone-800 dark:text-stone-100">
                  {book.title}
                </p>
                <p className="truncate pl-2 pr-1 text-[10px] text-stone-600 dark:text-stone-300">
                  {book.author || "Unknown author"}
                </p>
              </div>
            )}
            <div className="mt-2">
              {book.coverImage ? (
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {book.title}
                  </h3>
                  <p className="truncate text-xs text-stone-600 dark:text-stone-300">
                    {book.author || "Unknown author"}
                  </p>
                </div>
              ) : null}
              <div className="mt-1 flex items-center justify-between">
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded-md p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditBook(book);
                    }}
                    aria-label={`Edit ${book.title}`}
                  >
                    <Pencil size={14} className="text-stone-500" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteBook(book);
                    }}
                    aria-label={`Delete ${book.title}`}
                  >
                    <Trash2 size={14} className="text-stone-500" />
                  </button>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded-md p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleDonate(book);
                    }}
                    aria-label={`Toggle donate for ${book.title}`}
                  >
                    <HandCoins
                      size={14}
                      className={
                        book.readyToDonate
                          ? "fill-emerald-400 text-emerald-500"
                          : "text-stone-400"
                      }
                    />
                  </button>
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
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
