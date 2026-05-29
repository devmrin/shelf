import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Pencil, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Book } from "../features/books/types";

type Props = {
  book?: Book;
  onClose: () => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
};

function splitNames(value: string): string[] {
  return value
    .split(/\s*(?:,|&|;|\band\b)\s*/i)
    .map((name) => name.trim())
    .filter(Boolean);
}

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-700 transition hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
      aria-label={`Copy ${label} ${value}`}
      title={`Copy ${label}`}
    >
      {value}
      {copied ? (
        <Check size={11} className="text-emerald-500" />
      ) : (
        <Copy size={11} className="opacity-60" />
      )}
    </button>
  );
}

function CopyButton({
  value,
  label,
  variant = "inline",
}: {
  value: string;
  label: string;
  variant?: "inline" | "overlay";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const className =
    variant === "overlay"
      ? "inline-flex shrink-0 items-center rounded p-1 text-white/80 transition hover:text-white"
      : "inline-flex shrink-0 items-center rounded p-0.5 text-stone-400 opacity-0 transition hover:bg-stone-200 hover:text-stone-700 group-hover:opacity-100 dark:hover:bg-stone-800 dark:hover:text-stone-200";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check size={13} className="text-emerald-400" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}

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
                <div className="group flex items-start gap-1.5">
                  <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                    {book.title}
                  </h2>
                  <span className="mt-1.5">
                    <CopyButton value={book.title} label="book name" />
                  </span>
                </div>
                {book.author ? (
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1 text-sm text-stone-600 dark:text-stone-300">
                    {splitNames(book.author).map((name, index) => (
                      <span
                        key={`${name}-${index}`}
                        className="group inline-flex items-center gap-0.5"
                      >
                        <span>{name}</span>
                        <CopyButton value={name} label="author name" />
                        {index < splitNames(book.author).length - 1 ? (
                          <span className="text-stone-400">,</span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-600 dark:text-stone-300">
                    Unknown author
                  </p>
                )}
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
              <div className="group relative mb-4">
                <img
                  src={book.coverImage}
                  alt={`${book.title} cover`}
                  className="aspect-[3/4] w-full rounded-xl object-cover"
                  loading="lazy"
                />
                <div className="absolute right-2 top-2 rounded-md bg-black/40 opacity-0 backdrop-blur transition group-hover:opacity-100">
                  <CopyButton
                    value={book.coverImage}
                    label="cover image"
                    variant="overlay"
                  />
                </div>
              </div>
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
                <div className="group">
                  <dt className="text-stone-500 dark:text-stone-400">
                    Publisher
                  </dt>
                  <dd className="flex items-center gap-1 text-stone-900 dark:text-stone-100">
                    <span>{book.publisher}</span>
                    <CopyButton value={book.publisher!} label="publisher" />
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
                <div className="group col-span-2">
                  <dt className="text-stone-500 dark:text-stone-400">ISBN</dt>
                  <dd className="flex items-center gap-1 break-all text-stone-900 dark:text-stone-100">
                    <span>{book.isbn}</span>
                    <CopyButton value={book.isbn!} label="ISBN" />
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
                      <CopyChip
                        key={category}
                        value={category}
                        label="category"
                      />
                    ))}
                  </dd>
                </div>
              ) : null}
              {hasTags ? (
                <div className="col-span-2">
                  <dt className="text-stone-500 dark:text-stone-400">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {book.tags?.map((tag) => (
                      <CopyChip key={tag} value={tag} label="tag" />
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
