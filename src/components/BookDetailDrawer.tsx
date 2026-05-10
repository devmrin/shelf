import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Star, Trash2, X } from "lucide-react";
import type { Book } from "../features/books/types";

type Props = {
  book?: Book;
  onClose: () => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
};

export function BookDetailDrawer({ book, onClose, onEdit, onDelete }: Props) {
  const hasPublisher = Boolean(book?.publisher?.trim());
  const hasPublishedYear = typeof book?.publishedYear === "number";
  const hasIsbn = Boolean(book?.isbn?.trim());
  const hasCategories = Boolean(book?.categories?.length);
  const hasTags = Boolean(book?.tags?.length);
  const hasRating = typeof book?.rating === "number";

  return (
    <AnimatePresence>
      {book ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Close detail drawer"
          />
          <motion.aside
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-stone-200 bg-stone-100 p-4 dark:border-stone-700 dark:bg-stone-900"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                  {book.title}
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  {book.author || "Unknown author"}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-2 hover:bg-stone-200 dark:hover:bg-stone-800"
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>

            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={`${book.title} cover`}
                className="mb-4 aspect-[3/4] w-full rounded-xl object-cover"
                loading="lazy"
              />
            ) : null}

            {book.additionalImages?.length ? (
              <div className="mb-4 grid grid-cols-3 gap-2">
                {book.additionalImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${book.title} additional ${index + 1}`}
                    className="aspect-square rounded-md object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : null}

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2.5 py-1.5 text-xs hover:bg-stone-200 dark:border-stone-700 dark:hover:bg-stone-800"
                onClick={() => onEdit(book)}
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-stone-300 p-2 text-stone-600 hover:bg-stone-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                onClick={() => onDelete(book)}
                aria-label={`Move ${book.title} to trash`}
                title="Move to trash"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-stone-500 dark:text-stone-400">Status</dt>
                <dd className="capitalize text-stone-900 dark:text-stone-100">
                  {book.status ?? "unread"}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500 dark:text-stone-400">Favorite</dt>
                <dd className="text-stone-900 dark:text-stone-100">
                  {book.isFavorite ? (
                    <span className="inline-flex items-center gap-1">
                      <Star
                        size={14}
                        className="fill-amber-400 text-amber-500"
                      />
                      Yes
                    </span>
                  ) : (
                    "No"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500 dark:text-stone-400">Donate</dt>
                <dd className="text-stone-900 dark:text-stone-100">
                  {book.readyToDonate ? "Yes" : "No"}
                </dd>
              </div>
              {hasRating ? (
                <div>
                  <dt className="text-stone-500 dark:text-stone-400">Rating</dt>
                  <dd className="inline-flex items-center gap-1 text-stone-900 dark:text-stone-100">
                    <Star size={14} className="fill-amber-400 text-amber-500" />
                    {book.rating}/5
                  </dd>
                </div>
              ) : null}
              {hasPublisher ? (
                <div>
                  <dt className="text-stone-500 dark:text-stone-400">
                    Publisher
                  </dt>
                  <dd className="text-stone-900 dark:text-stone-100">
                    {book.publisher}
                  </dd>
                </div>
              ) : null}
              {hasPublishedYear ? (
                <div>
                  <dt className="text-stone-500 dark:text-stone-400">Year</dt>
                  <dd className="text-stone-900 dark:text-stone-100">
                    {book.publishedYear}
                  </dd>
                </div>
              ) : null}
              {hasIsbn ? (
                <div className="col-span-2">
                  <dt className="text-stone-500 dark:text-stone-400">ISBN</dt>
                  <dd className="break-all text-stone-900 dark:text-stone-100">
                    {book.isbn}
                  </dd>
                </div>
              ) : null}
              {hasCategories ? (
                <div className="col-span-2">
                  <dt className="text-stone-500 dark:text-stone-400">
                    Categories
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {book.categories?.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                      >
                        {category}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
              {hasTags ? (
                <div className="col-span-2">
                  <dt className="text-stone-500 dark:text-stone-400">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {book.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>

            {book.notes ? (
              <section className="mt-4">
                <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Notes
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600 dark:text-stone-300">
                  {book.notes}
                </p>
              </section>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
