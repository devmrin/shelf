import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Plus } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopToolbar } from "../components/TopToolbar";
import { GalleryView } from "../components/GalleryView";
import { TableView } from "../components/TableView";
import { BookDetailDrawer } from "../components/BookDetailDrawer";
import { EmptyState } from "../components/EmptyState";
import { ToastStack, type ToastItem } from "../components/ToastStack";
import type {
  Book,
  BookDraft,
  QuickFilter,
  ReadingStatus,
} from "../features/books/types";
import {
  addBook,
  bulkEditBooks,
  collectionStats,
  exportJson,
  importJson,
  queryBooks,
  restoreBooks,
  seedSampleData,
  softDeleteBooks,
  updateBook,
} from "../features/books/repository";
import { useUIStore } from "../stores/uiStore";
import { useSelectionStore } from "../stores/selectionStore";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useHotkeys } from "../hooks/useHotkeys";
import { useMediaQuery } from "../hooks/useMediaQuery";

function toFilters(quickFilters: QuickFilter[]) {
  const statuses: ReadingStatus[] = [];
  if (quickFilters.includes("unread")) statuses.push("unread");
  if (quickFilters.includes("reading")) statuses.push("reading");
  if (quickFilters.includes("completed")) statuses.push("completed");

  return {
    favorites: quickFilters.includes("favorites"),
    donate: quickFilters.includes("donate"),
    hasImage: quickFilters.includes("has-image"),
    missingMetadata: quickFilters.includes("missing-metadata"),
    statuses: statuses.length ? statuses : undefined,
  };
}

export function ShelfPage() {
  const [search, setSearch] = useState("");
  const [activeBook, setActiveBook] = useState<Book | undefined>();
  const [editingBook, setEditingBook] = useState<Book | undefined>();
  const [contextBook, setContextBook] = useState<Book | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const debouncedSearch = useDebouncedValue(search, 180);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const searchRef = useRef<HTMLInputElement | null>(null);

  const {
    viewMode,
    setViewMode,
    sortMode,
    setSortMode,
    quickFilters,
    toggleQuickFilter,
    sidebarOpen,
    setSidebarOpen,
    darkMode,
    setDarkMode,
    columnVisibility,
    setColumnVisibility,
  } = useUIStore();

  const { selectedIds, toggle, clear } = useSelectionStore();

  const books =
    useLiveQuery(
      () =>
        queryBooks({
          search: debouncedSearch,
          filters: toFilters(quickFilters),
          sort: sortMode,
        }),
      [debouncedSearch, quickFilters, sortMode],
      [],
    ) ?? [];

  const stats = useLiveQuery(() => collectionStats(), [books.length], {
    total: 0,
    favorites: 0,
    donation: 0,
    reading: 0,
    completed: 0,
  }) ?? { total: 0, favorites: 0, donation: 0, reading: 0, completed: 0 };

  useEffect(() => {
    void seedSampleData();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldUseDark =
      darkMode === "dark" || (darkMode === "system" && prefersDark);
    root.classList.toggle("dark", shouldUseDark);
  }, [darkMode]);

  const addToast = (item: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { ...item, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  };

  const cycleStatus = async (book: Book) => {
    const nextStatus: ReadingStatus =
      book.status === "reading"
        ? "completed"
        : book.status === "completed"
          ? "unread"
          : "reading";

    await updateBook(book.id, { status: nextStatus });

    const label =
      nextStatus === "completed"
        ? "read"
        : nextStatus === "reading"
          ? "reading"
          : "unread";

    addToast({ message: `${book.title} marked ${label}` });
  };

  const handleSave = async (payload: BookDraft) => {
    if (editingBook) {
      await updateBook(editingBook.id, payload);
      addToast({ message: `${editingBook.title} updated` });
      setEditingBook(undefined);
      return;
    }
    await addBook(payload);
    addToast({ message: "Book added" });
  };

  const startEditing = (book: Book) => {
    setEditingBook(book);
    if (isMobile) setSidebarOpen(true);
  };

  const deleteOne = async (book: Book) => {
    const confirmed = window.confirm(`Delete \"${book.title}\"?`);
    if (!confirmed) return;

    await softDeleteBooks([book.id]);

    if (activeBook?.id === book.id) setActiveBook(undefined);
    if (contextBook?.id === book.id) setContextBook(null);
    if (editingBook?.id === book.id) setEditingBook(undefined);

    addToast({
      message: `${book.title} moved to trash`,
      actionLabel: "Undo",
      onAction: () => {
        void restoreBooks([book.id]);
      },
    });
  };

  const handleExport = async () => {
    const backup = await exportJson();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shelf-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    await importJson(parsed);
    addToast({ message: "Backup imported successfully" });
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    const ids = [...selectedIds];
    await softDeleteBooks(ids);
    clear();
    addToast({
      message: `${ids.length} books moved to trash`,
      actionLabel: "Undo",
      onAction: () => {
        void restoreBooks(ids);
      },
    });
  };

  const quickFilterEmptyState = useMemo(() => {
    if (!quickFilters.length) return null;
    if (quickFilters.includes("favorites")) return "No favorite books yet.";
    if (quickFilters.includes("donate")) return "No books in donation pile.";
    return "No books matched these filters.";
  }, [quickFilters]);

  useHotkeys({
    "/": (event) => {
      event.preventDefault();
      searchRef.current?.focus();
      const input = document.querySelector<HTMLInputElement>(
        'input[aria-label="Global book search"]',
      );
      input?.focus();
    },
    n: () => {
      if (isMobile) setSidebarOpen(true);
      const input = document.querySelector<HTMLInputElement>(
        'input[aria-label="Book title"]',
      );
      input?.focus();
    },
    g: () => setViewMode("gallery"),
    t: () => setViewMode("table"),
    f: () => {
      if (selectedIds.length === 1) {
        const book = books.find((entry) => entry.id === selectedIds[0]);
        if (book) {
          void updateBook(book.id, { isFavorite: !book.isFavorite });
          addToast({ message: `${book.title} favorite updated` });
        }
      }
    },
    delete: () => {
      void deleteSelected();
    },
  });

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_20%,rgba(231,229,228,0.5),transparent_45%),radial-gradient(circle_at_100%_0%,rgba(214,211,209,0.3),transparent_28%)] text-stone-800 dark:bg-[radial-gradient(circle_at_10%_20%,rgba(28,25,23,0.6),transparent_45%),radial-gradient(circle_at_100%_0%,rgba(41,37,36,0.6),transparent_28%)] dark:text-stone-100">
      <div className="mx-auto flex h-full max-w-[1600px]">
        {!isMobile ? (
          <div className="w-[320px] shrink-0">
            <Sidebar
              onSave={handleSave}
              editingBook={editingBook}
              onCancelEdit={() => setEditingBook(undefined)}
              stats={stats}
            />
          </div>
        ) : null}

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopToolbar
            search={search}
            onSearchChange={setSearch}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            theme={darkMode}
            onThemeChange={setDarkMode}
            quickFilters={quickFilters}
            onToggleQuickFilter={toggleQuickFilter}
            onExport={() => void handleExport()}
            onImport={handleImport}
          />

          <div className="min-h-0 flex-1">
            {books.length === 0 ? (
              <EmptyState
                title={
                  debouncedSearch || quickFilters.length
                    ? "No results"
                    : "Your shelf is empty"
                }
                description={
                  debouncedSearch
                    ? "Try another query or clear filters."
                    : (quickFilterEmptyState ??
                      "Add your first book from the left panel.")
                }
                action={
                  <button
                    type="button"
                    className="rounded-md bg-stone-900 px-3 py-1.5 text-sm text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                    onClick={() => {
                      const input = document.querySelector<HTMLInputElement>(
                        'input[aria-label="Book title"]',
                      );
                      input?.focus();
                      if (isMobile) setSidebarOpen(true);
                    }}
                  >
                    Add a Book
                  </button>
                }
              />
            ) : viewMode === "gallery" ? (
              <GalleryView
                books={books}
                onOpenBook={setActiveBook}
                onToggleFavorite={(book) => {
                  void updateBook(book.id, { isFavorite: !book.isFavorite });
                  addToast({ message: `${book.title} favorite updated` });
                }}
                onToggleDonate={(book) => {
                  void updateBook(book.id, {
                    readyToDonate: !book.readyToDonate,
                  });
                  addToast({ message: `${book.title} donate flag updated` });
                }}
                onCycleStatus={(book) => {
                  void cycleStatus(book);
                }}
                onEditBook={startEditing}
                onDeleteBook={(book) => {
                  void deleteOne(book);
                }}
                onContextMenu={(event, book) => {
                  event.preventDefault();
                  setContextBook(book);
                }}
              />
            ) : (
              <TableView
                books={books}
                selectedIds={selectedIds}
                onToggleSelect={toggle}
                onOpenBook={setActiveBook}
                onEditBook={startEditing}
                onDeleteBook={(book) => {
                  void deleteOne(book);
                }}
                onBulkDelete={deleteSelected}
                onBulkFavorite={() =>
                  bulkEditBooks(selectedIds, { favorite: true })
                }
                onBulkDonate={() =>
                  bulkEditBooks(selectedIds, { donate: true })
                }
                onBulkAddCategory={(value) =>
                  bulkEditBooks(selectedIds, { addCategory: value })
                }
                onBulkAddTag={(value) =>
                  bulkEditBooks(selectedIds, { addTag: value })
                }
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={(value) => {
                  if (typeof value === "function") {
                    setColumnVisibility(value(columnVisibility));
                  } else {
                    setColumnVisibility(value);
                  }
                }}
              />
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isMobile && sidebarOpen ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-black/35"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 z-50 h-full w-[90vw] max-w-[340px]"
              initial={{ x: -18, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -18, opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <Sidebar
                onSave={async (payload) => {
                  await handleSave(payload);
                  setSidebarOpen(false);
                }}
                editingBook={editingBook}
                onCancelEdit={() => setEditingBook(undefined)}
                stats={stats}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {isMobile ? (
        <>
          <button
            type="button"
            className="fixed left-3 top-3 z-30 rounded-lg border border-stone-300 bg-stone-50/90 p-2 backdrop-blur dark:border-stone-700 dark:bg-stone-900/90"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={16} />
          </button>
          <button
            type="button"
            className="fixed bottom-5 right-5 z-30 rounded-full bg-stone-900 p-3 text-stone-50 shadow-lg dark:bg-stone-100 dark:text-stone-900"
            onClick={() => setSidebarOpen(true)}
            aria-label="Add new book"
          >
            <Plus size={18} />
          </button>
        </>
      ) : null}

      {contextBook ? (
        <div className="fixed z-50" style={{ top: 90, left: 40 }}>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs shadow-lg dark:border-stone-700 dark:bg-stone-900">
            <button
              type="button"
              className="block w-full rounded-md px-2 py-1 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
              onClick={() => {
                void updateBook(contextBook.id, {
                  isFavorite: !contextBook.isFavorite,
                });
                setContextBook(null);
              }}
            >
              Toggle Favorite
            </button>
            <button
              type="button"
              className="block w-full rounded-md px-2 py-1 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
              onClick={() => {
                startEditing(contextBook);
                setContextBook(null);
              }}
            >
              Edit Book
            </button>
            <button
              type="button"
              className="block w-full rounded-md px-2 py-1 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
              onClick={() => {
                void deleteOne(contextBook);
                setContextBook(null);
              }}
            >
              Delete Book
            </button>
          </div>
        </div>
      ) : null}

      <BookDetailDrawer
        book={activeBook}
        onClose={() => setActiveBook(undefined)}
        onEdit={(book) => {
          startEditing(book);
          setActiveBook(undefined);
        }}
        onDelete={(book) => {
          void deleteOne(book);
        }}
      />
      <ToastStack
        items={toasts}
        onDismiss={(id) =>
          setToasts((current) => current.filter((item) => item.id !== id))
        }
      />
    </div>
  );
}
