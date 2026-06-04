import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Plus } from "lucide-react";
import { BarcodeScanModal } from "../components/BarcodeScanModal";
import { Sidebar } from "../components/Sidebar";
import { TopToolbar } from "../components/TopToolbar";
import { WebSearchModal } from "../components/WebSearchModal";
import { GalleryView } from "../components/GalleryView";
import {
  BookContextMenu,
  type BookActionsMenuHandlers,
  type ContextMenuTarget,
} from "../components/BookActionsMenu";
import { TableView } from "../components/TableView";
import { BookDetailDrawer } from "../components/BookDetailDrawer";
import { EmptyState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { TrashDialog } from "../components/TrashDialog";
import { ToastStack, type ToastItem } from "../components/ToastStack";
import type {
  Book,
  BookDraft,
  Folder,
  QuickFilter,
  ReadingStatus,
} from "../features/books/types";
import {
  addBook,
  bulkEditBooks,
  collectionStats,
  countUncategorizedBooks,
  createFolder,
  deleteFolder,
  exportJson,
  getCategoryTagOptions,
  getTrashedBooks,
  importJson,
  listFolders,
  moveBooksToFolder,
  permanentlyDeleteBooks,
  queryBooks,
  renameFolder,
  restoreBooks,
  softDeleteBooks,
  updateBook,
} from "../features/books/repository";
import { useUIStore } from "../stores/uiStore";
import { useSelectionStore } from "../stores/selectionStore";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useHotkeys } from "../hooks/useHotkeys";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { cameraScanSupported } from "../utils/camera";

type PendingConfirm =
  | { type: "softDelete"; book: Book }
  | { type: "permDelete"; book: Book }
  | { type: "permDeleteAll" }
  | { type: "deleteFolder"; folder: Folder };

function confirmCopy(p: PendingConfirm) {
  switch (p.type) {
    case "softDelete":
      return {
        title: "Move to trash?",
        description: `"${p.book.title}" will be moved to trash. You can restore it from the trash control in the toolbar.`,
        confirmLabel: "Move to trash",
        variant: "default" as const,
      };
    case "permDelete":
      return {
        title: "Delete forever?",
        description: `"${p.book.title}" will be permanently removed. This cannot be undone.`,
        confirmLabel: "Delete forever",
        variant: "destructive" as const,
      };
    case "permDeleteAll":
      return {
        title: "Empty trash?",
        description:
          "Permanently delete all trashed books? This cannot be undone.",
        confirmLabel: "Delete all forever",
        variant: "destructive" as const,
      };
    case "deleteFolder":
      return {
        title: "Delete folder?",
        description: `"${p.folder.name}" will be deleted. Books inside will become uncategorized.`,
        confirmLabel: "Delete folder",
        variant: "destructive" as const,
      };
  }
}

function toFilters(
  quickFilters: QuickFilter[],
  selectedCategories: string[],
  selectedTags: string[],
) {
  const statuses: ReadingStatus[] = [];
  if (quickFilters.includes("unread")) statuses.push("unread");
  if (quickFilters.includes("reading")) statuses.push("reading");
  if (quickFilters.includes("completed")) statuses.push("completed");

  return {
    rated: quickFilters.includes("rated"),
    donate: quickFilters.includes("donate"),
    hasImage: quickFilters.includes("has-image"),
    missingMetadata: quickFilters.includes("missing-metadata"),
    statuses: statuses.length ? statuses : undefined,
    categories: selectedCategories.length ? selectedCategories : undefined,
    tags: selectedTags.length ? selectedTags : undefined,
  };
}

export function ShelfPage() {
  const [search, setSearch] = useState("");
  const [activeBook, setActiveBook] = useState<Book | undefined>();
  const [editingBook, setEditingBook] = useState<Book | undefined>();
  const [contextTarget, setContextTarget] = useState<ContextMenuTarget | null>(
    null,
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [trashOpen, setTrashOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );
  const [webSearchOpen, setWebSearchOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [prefillDraft, setPrefillDraft] = useState<BookDraft | undefined>();

  const debouncedSearch = useDebouncedValue(search, 180);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const showScanButton = isMobile && cameraScanSupported();
  const searchRef = useRef<HTMLInputElement | null>(null);

  const {
    viewMode,
    setViewMode,
    sortMode,
    setSortMode,
    quickFilters,
    toggleQuickFilter,
    selectedCategories,
    selectedTags,
    setSelectedCategories,
    setSelectedTags,
    sidebarOpen,
    setSidebarOpen,
    darkMode,
    setDarkMode,
    columnVisibility,
    setColumnVisibility,
    activeFolderId,
    setActiveFolderId,
  } = useUIStore();

  const { selectedIds, toggle, clear, setMany } = useSelectionStore();

  const folderRows = useLiveQuery(() => listFolders(), []) ?? [];
  const uncategorizedCount =
    useLiveQuery(() => countUncategorizedBooks(), []) ?? 0;

  const taxonomyOptions =
    useLiveQuery(() => getCategoryTagOptions(), []) ?? {
      categories: [],
      tags: [],
    };

  const categoryFilterOptions = useMemo(
    () =>
      [...new Set([...taxonomyOptions.categories, ...selectedCategories])].sort(
        (a, b) => a.localeCompare(b),
      ),
    [taxonomyOptions.categories, selectedCategories],
  );

  const tagFilterOptions = useMemo(
    () =>
      [...new Set([...taxonomyOptions.tags, ...selectedTags])].sort((a, b) =>
        a.localeCompare(b),
      ),
    [taxonomyOptions.tags, selectedTags],
  );

  const books =
    useLiveQuery(
      () =>
        queryBooks({
          search: debouncedSearch,
          filters: toFilters(
            quickFilters,
            selectedCategories,
            selectedTags,
          ),
          sort: sortMode,
          folderScope: activeFolderId,
        }),
      [
        debouncedSearch,
        quickFilters,
        sortMode,
        selectedCategories,
        selectedTags,
        activeFolderId,
      ],
      [],
    ) ?? [];

  const stats = useLiveQuery(() => collectionStats(), [books.length], {
    total: 0,
    rated: 0,
    donation: 0,
    reading: 0,
    completed: 0,
  }) ?? { total: 0, rated: 0, donation: 0, reading: 0, completed: 0 };

  const trashedBooks = useLiveQuery(() => getTrashedBooks(), [], []) ?? [];

  useEffect(() => {
    if (activeFolderId === "uncategorized") return;
    const exists = folderRows.some((f) => f.id === activeFolderId);
    if (!exists) setActiveFolderId("uncategorized");
  }, [activeFolderId, folderRows, setActiveFolderId]);

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

  const preferredFolderId = useMemo(
    () =>
      activeFolderId !== "uncategorized" ? activeFolderId : undefined,
    [activeFolderId],
  );

  const applyPrefill = (draft: BookDraft) => {
    setEditingBook(undefined);
    setPrefillDraft(draft);
    if (isMobile) setSidebarOpen(true);
    addToast({ message: "Book details loaded — review and save" });
  };

  const folderScopeLabelText = useMemo(() => {
    if (activeFolderId === "uncategorized") return undefined;
    const name = folderRows.find((f) => f.id === activeFolderId)?.name;
    return name ? `Showing: ${name}` : undefined;
  }, [activeFolderId, folderRows]);

  const relocateBooksToFolder = async (
    bookIds: string[],
    folderId: string | null,
  ) => {
    if (!bookIds.length) return;
    await moveBooksToFolder(bookIds, folderId);
    const label =
      folderId == null
        ? "Uncategorized"
        : folderRows.find((f) => f.id === folderId)?.name ?? "folder";
    addToast({
      message:
        bookIds.length === 1
          ? `Moved 1 book to ${label}`
          : `Moved ${bookIds.length} books to ${label}`,
    });
  };

  const handleCreateFolderFromSidebar = async (name: string) => {
    try {
      await createFolder(name);
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : "Could not create folder",
      });
    }
  };

  const handleRenameFolderFromSidebar = async (id: string, name: string) => {
    try {
      await renameFolder(id, name);
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : "Could not rename folder",
      });
    }
  };

  const runDeleteFolder = async (folder: Folder) => {
    await deleteFolder(folder.id);
    if (activeFolderId === folder.id) setActiveFolderId("uncategorized");
    addToast({ message: `"${folder.name}" deleted` });
  };

  const closeContextMenu = () => {
    setContextTarget(null);
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
    setPrefillDraft(undefined);
    addToast({ message: "Book added" });
  };

  const startEditing = (book: Book) => {
    setPrefillDraft(undefined);
    setEditingBook(book);
    if (isMobile) setSidebarOpen(true);
  };

  const requestSoftDelete = (book: Book) => {
    setPendingConfirm({ type: "softDelete", book });
  };

  const menuHandlers: BookActionsMenuHandlers = {
    onOpenBook: setActiveBook,
    onEditBook: startEditing,
    onSetRating: (book, rating) => {
      void updateBook(book.id, { rating });
      addToast({
        message: rating
          ? `${book.title} rated ${rating}/5`
          : `${book.title} rating cleared`,
      });
    },
    onToggleDonate: (book) => {
      void updateBook(book.id, { readyToDonate: !book.readyToDonate });
      addToast({ message: `${book.title} donate flag updated` });
    },
    onMoveToFolder: (book, folderId) => {
      void relocateBooksToFolder([book.id], folderId);
    },
    onDeleteBook: requestSoftDelete,
  };

  const runSoftDelete = async (book: Book) => {
    await softDeleteBooks([book.id]);

    if (activeBook?.id === book.id) setActiveBook(undefined);
    if (contextTarget?.book.id === book.id) closeContextMenu();
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
    const timestamp = new Date()
      .toISOString()
      .replace("T", "_")
      .replace(/[:.]/g, "-");
    a.download = `shelf-backup-${timestamp}.json`;
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

  const handleRestoreFromTrash = async (book: Book) => {
    await restoreBooks([book.id]);
    addToast({ message: `${book.title} restored` });
  };

  const handlePermanentlyDeleteFromTrash = (book: Book) => {
    setPendingConfirm({ type: "permDelete", book });
  };

  const runPermanentDeleteOne = async (book: Book) => {
    await permanentlyDeleteBooks([book.id]);

    if (activeBook?.id === book.id) setActiveBook(undefined);
    if (contextTarget?.book.id === book.id) closeContextMenu();
    if (editingBook?.id === book.id) setEditingBook(undefined);

    addToast({ message: `${book.title} permanently deleted` });
  };

  const handleRestoreAllFromTrash = async () => {
    if (!trashedBooks.length) return;
    const ids = trashedBooks.map((book) => book.id);
    await restoreBooks(ids);
    addToast({ message: `${ids.length} books restored` });
  };

  const handlePermanentlyDeleteAllFromTrash = () => {
    if (!trashedBooks.length) return;
    setPendingConfirm({ type: "permDeleteAll" });
  };

  const runPermanentDeleteAll = async () => {
    if (!trashedBooks.length) return;
    const ids = trashedBooks.map((book) => book.id);
    await permanentlyDeleteBooks(ids);

    if (activeBook && ids.includes(activeBook.id)) setActiveBook(undefined);
    if (contextTarget && ids.includes(contextTarget.book.id))
      closeContextMenu();
    if (editingBook && ids.includes(editingBook.id)) setEditingBook(undefined);

    addToast({ message: `${ids.length} books permanently deleted` });
  };

  const handleConfirmedAction = () => {
    const p = pendingConfirm;
    if (!p) return;
    if (p.type === "softDelete") {
      void runSoftDelete(p.book);
      return;
    }
    if (p.type === "permDelete") {
      void runPermanentDeleteOne(p.book);
      return;
    }
    if (p.type === "permDeleteAll") {
      void runPermanentDeleteAll();
      return;
    }
    void runDeleteFolder(p.folder);
  };

  const quickFilterEmptyState = useMemo(() => {
    if (!quickFilters.length) return null;
    if (quickFilters.includes("rated")) return "No rated books yet.";
    if (quickFilters.includes("donate")) return "No books in donation pile.";
    return "No books matched these filters.";
  }, [quickFilters]);

  const sidebarFolderNavProps = {
    preferredFolderId,
    folders: folderRows,
    uncategorizedCount,
    activeFolderId,
    onSelectFolder: setActiveFolderId,
    onCreateFolder: handleCreateFolderFromSidebar,
    onRenameFolder: handleRenameFolderFromSidebar,
    onRequestDeleteFolder: (folder: Folder) =>
      setPendingConfirm({ type: "deleteFolder", folder }),
    onMoveBooksToFolder: (folderId: string | null, bookIds: string[]) =>
      relocateBooksToFolder(bookIds, folderId),
  };

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
    delete: () => {
      void deleteSelected();
    },
  });

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_20%,rgba(231,229,228,0.5),transparent_45%),radial-gradient(circle_at_100%_0%,rgba(214,211,209,0.3),transparent_28%)] text-stone-800 dark:bg-[radial-gradient(circle_at_10%_20%,rgba(28,25,23,0.6),transparent_45%),radial-gradient(circle_at_100%_0%,rgba(41,37,36,0.6),transparent_28%)] dark:text-stone-100">
      <div className="flex h-full w-full">
        {!isMobile ? (
          <div className="h-full w-[320px] shrink-0">
            <Sidebar
              onSave={handleSave}
              editingBook={editingBook}
              onCancelEdit={() => setEditingBook(undefined)}
              prefill={prefillDraft}
              stats={stats}
              {...sidebarFolderNavProps}
            />
          </div>
        ) : null}

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopToolbar
            search={search}
            onSearchChange={setSearch}
            categoryOptions={categoryFilterOptions}
            tagOptions={tagFilterOptions}
            selectedCategory={selectedCategories[0]}
            selectedTag={selectedTags[0]}
            onCategoryFilterChange={(value) =>
              setSelectedCategories(value ? [value] : [])
            }
            onTagFilterChange={(value) => setSelectedTags(value ? [value] : [])}
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
            trashedCount={trashedBooks.length}
            onOpenTrash={() => setTrashOpen(true)}
            folderScopeLabel={folderScopeLabelText}
            onOpenWebSearch={() => setWebSearchOpen(true)}
            onOpenScan={() => setScanOpen(true)}
            showScanButton={showScanButton}
          />

          <div className="min-h-0 flex-1">
            {books.length === 0 ? (
              <EmptyState
                title={
                  debouncedSearch.trim() ||
                  quickFilters.length ||
                  selectedCategories.length ||
                  selectedTags.length
                    ? "No results"
                    : stats.total === 0
                      ? "Your shelf is empty"
                      : activeFolderId === "uncategorized"
                        ? "No uncategorized books"
                        : "No books in this folder"
                }
                description={
                  debouncedSearch.trim()
                    ? "Try another query or clear filters."
                    : quickFilterEmptyState ??
                      (stats.total === 0
                        ? "Add your first book from the sidebar."
                        : activeFolderId === "uncategorized"
                          ? "Every book is in a folder, or this view is filtered. Pick a folder below to see those books."
                          : "Drag books here from Uncategorized or another folder, or assign this folder while editing.")
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
                selectedIds={selectedIds}
                folderOptions={folderRows.map((folder) => ({
                  id: folder.id,
                  name: folder.name,
                }))}
                menuHandlers={menuHandlers}
                onOpenBook={setActiveBook}
                onCycleStatus={(book) => {
                  void cycleStatus(book);
                }}
                onContextMenu={(event, book) => {
                  event.preventDefault();
                  setContextTarget({
                    book,
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
              />
            ) : (
              <TableView
                books={books}
                selectedIds={selectedIds}
                folderOptions={folderRows.map((folder) => ({
                  id: folder.id,
                  name: folder.name,
                }))}
                onToggleSelect={toggle}
                onToggleSelectAll={(selectAll) =>
                  selectAll ? setMany(books.map((book) => book.id)) : clear()
                }
                onOpenBook={setActiveBook}
                onEditBook={startEditing}
                onDeleteBook={requestSoftDelete}
                onBulkDelete={deleteSelected}
                onBulkDonate={() =>
                  bulkEditBooks(selectedIds, { donate: true })
                }
                onBulkAddCategory={(value) =>
                  bulkEditBooks(selectedIds, { addCategory: value })
                }
                onBulkAddTag={(value) =>
                  bulkEditBooks(selectedIds, { addTag: value })
                }
                onBulkMoveToFolder={async (folderId) => {
                  await relocateBooksToFolder(selectedIds, folderId);
                  clear();
                }}
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
                  setPrefillDraft(undefined);
                }}
                editingBook={editingBook}
                onCancelEdit={() => setEditingBook(undefined)}
                prefill={prefillDraft}
                stats={stats}
                {...sidebarFolderNavProps}
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

      <BookContextMenu
        target={contextTarget}
        folderOptions={folderRows.map((folder) => ({
          id: folder.id,
          name: folder.name,
        }))}
        handlers={menuHandlers}
        onClose={closeContextMenu}
      />

      <BookDetailDrawer
        book={activeBook}
        onClose={() => setActiveBook(undefined)}
        onEdit={(book) => {
          startEditing(book);
          setActiveBook(undefined);
        }}
        onDelete={requestSoftDelete}
      />
      {pendingConfirm ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingConfirm(null);
          }}
          {...confirmCopy(pendingConfirm)}
          onConfirm={handleConfirmedAction}
        />
      ) : null}
      <TrashDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        books={trashedBooks}
        onRestoreBook={(book) => {
          void handleRestoreFromTrash(book);
        }}
        onDeleteBookForever={(book) => {
          void handlePermanentlyDeleteFromTrash(book);
        }}
        onRestoreAll={() => {
          void handleRestoreAllFromTrash();
        }}
        onDeleteAllForever={() => {
          void handlePermanentlyDeleteAllFromTrash();
        }}
      />
      <WebSearchModal
        open={webSearchOpen}
        onOpenChange={setWebSearchOpen}
        onSelect={applyPrefill}
      />
      <BarcodeScanModal
        open={scanOpen}
        onOpenChange={setScanOpen}
        onSelect={applyPrefill}
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
