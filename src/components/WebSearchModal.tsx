import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BookDraft } from "../features/books/types";
import {
  coverUrlForResult,
  searchOpenLibrary,
  toBookDraft,
  type OpenLibraryResult,
} from "../features/books/openLibrary";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (draft: BookDraft) => void;
};

function WebSearchModalBody({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (draft: BookDraft) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenLibraryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectingKey, setSelectingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 320);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = debouncedQuery.trim();

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!trimmedQuery) return;

    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await searchOpenLibrary(trimmedQuery, {
          limit: 12,
          signal: controller.signal,
        });
        if (cancelled) return;
        setResults(items);
      } catch (err: unknown) {
        if (cancelled) return;
        setResults([]);
        setError(
          err instanceof Error ? err.message : "Could not search Open Library",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [trimmedQuery]);

  const handleSelect = async (result: OpenLibraryResult) => {
    const key = result.key ?? result.title;
    setSelectingKey(key);
    setError(null);
    try {
      const draft = await toBookDraft(result);
      onSelect(draft);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not load book details",
      );
    } finally {
      setSelectingKey(null);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-700">
        <div className="min-w-0">
          <Dialog.Title className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Add from web
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            Search Open Library and import metadata into your shelf.
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <button
            type="button"
            className="shrink-0 rounded-md p-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </Dialog.Close>
      </div>

      <div className="px-4 py-3">
        <label className="relative block">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-full rounded-lg border border-stone-300 bg-stone-50 pl-8 pr-2 text-sm outline-none ring-stone-400 placeholder:text-stone-400 focus:ring-2 dark:border-stone-700 dark:bg-stone-950"
            placeholder="Title, author, ISBN..."
            aria-label="Search Open Library"
          />
        </label>
      </div>

      <div className="shelf-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-500">
            <Loader2 size={16} className="animate-spin" />
            Searching Open Library...
          </div>
        ) : null}

        {!loading && error ? (
          <p className="px-2 py-6 text-center text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {!loading && !error && trimmedQuery && results.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-stone-500">
            No books found. Try another title or ISBN.
          </p>
        ) : null}

        {!loading && !error && !trimmedQuery ? (
          <p className="px-2 py-6 text-center text-sm text-stone-500">
            Type to search millions of books on Open Library.
          </p>
        ) : null}

        <ul className="space-y-1">
          {results.map((result) => {
            const key = result.key ?? `${result.title}-${result.isbn?.[0] ?? ""}`;
            const cover = coverUrlForResult(result, "S");
            const busy = selectingKey === (result.key ?? result.title);
            return (
              <li key={key}>
                <button
                  type="button"
                  disabled={Boolean(selectingKey)}
                  onClick={() => void handleSelect(result)}
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-stone-200/80 disabled:opacity-60 dark:hover:bg-stone-800"
                >
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded border border-stone-200 bg-stone-200 dark:border-stone-700 dark:bg-stone-800">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-500">
                        No cover
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                      {result.title}
                    </p>
                    <p className="truncate text-xs text-stone-600 dark:text-stone-400">
                      {result.author_name?.join(", ") || "Unknown author"}
                      {result.first_publish_year
                        ? ` · ${result.first_publish_year}`
                        : ""}
                    </p>
                    {busy ? (
                      <p className="mt-1 text-xs text-stone-500">
                        Loading cover...
                      </p>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export function WebSearchModal({ open, onOpenChange, onSelect }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 data-[state=open]:animate-[fadeIn_140ms_ease-out]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] flex max-h-[min(640px,90vh)] w-[min(520px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-stone-200 bg-stone-100 shadow-2xl outline-none dark:border-stone-700 dark:bg-stone-900 data-[state=open]:animate-[scaleIn_160ms_ease-out]">
          {open ? (
            <WebSearchModalBody
              onClose={() => onOpenChange(false)}
              onSelect={onSelect}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
