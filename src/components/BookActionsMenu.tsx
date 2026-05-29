import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronRight,
  Eye,
  FolderInput,
  HandCoins,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import type { Book } from "../features/books/types";

export type BookActionsMenuHandlers = {
  onOpenBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onSetRating: (book: Book, rating: number | undefined) => void;
  onToggleDonate: (book: Book) => void;
  onMoveToFolder: (book: Book, folderId: string | null) => void;
  onDeleteBook: (book: Book) => void;
};

type FolderOption = { id: string; name: string };

const contentClassName =
  "z-[60] max-h-[70vh] w-[min(15rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs shadow-lg dark:border-stone-700 dark:bg-stone-900";

const itemClassName =
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-left text-stone-800 outline-none data-[highlighted]:bg-stone-100 dark:text-stone-200 dark:data-[highlighted]:bg-stone-800";

const labelClassName =
  "px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400";

const separatorClassName =
  "my-1 h-px bg-stone-200 dark:bg-stone-700";

function MenuItems({
  book,
  folderOptions,
  handlers,
}: {
  book: Book;
  folderOptions: FolderOption[];
  handlers: BookActionsMenuHandlers;
}) {
  const currentRating = book.rating ?? 0;

  return (
    <>
      <DropdownMenu.Item
        className={itemClassName}
        onSelect={() => handlers.onOpenBook(book)}
      >
        <Eye size={13} className="shrink-0 text-stone-500" />
        View details
      </DropdownMenu.Item>

      <DropdownMenu.Item
        className={itemClassName}
        onSelect={() => handlers.onEditBook(book)}
      >
        <Pencil size={13} className="shrink-0 text-stone-500" />
        Edit book
      </DropdownMenu.Item>

      <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger className={itemClassName}>
          <Star size={13} className="shrink-0 text-stone-500" />
          <span className="flex-1">Rating</span>
          <span className="text-stone-400">
            {currentRating ? `${currentRating}/5` : "—"}
          </span>
          <ChevronRight size={13} className="shrink-0 text-stone-400" />
        </DropdownMenu.SubTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.SubContent className={contentClassName} sideOffset={4}>
            {[1, 2, 3, 4, 5].map((value) => (
              <DropdownMenu.Item
                key={value}
                className={itemClassName}
                onSelect={() => handlers.onSetRating(book, value)}
              >
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      className={
                        value >= star
                          ? "fill-amber-400 text-amber-500"
                          : "text-stone-300 dark:text-stone-600"
                      }
                    />
                  ))}
                </span>
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className={separatorClassName} />
            <DropdownMenu.Item
              className={itemClassName}
              onSelect={() => handlers.onSetRating(book, undefined)}
            >
              Clear rating
            </DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Portal>
      </DropdownMenu.Sub>

      <DropdownMenu.Item
        className={itemClassName}
        onSelect={() => handlers.onToggleDonate(book)}
      >
        <HandCoins
          size={13}
          className={
            book.readyToDonate
              ? "shrink-0 fill-emerald-400 text-emerald-500"
              : "shrink-0 text-stone-500"
          }
        />
        {book.readyToDonate ? "Remove from donate pile" : "Mark for donation"}
      </DropdownMenu.Item>

      <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger className={itemClassName}>
          <FolderInput size={13} className="shrink-0 text-stone-500" />
          <span className="flex-1">Move to folder</span>
          <ChevronRight size={13} className="shrink-0 text-stone-400" />
        </DropdownMenu.SubTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.SubContent className={contentClassName} sideOffset={4}>
            <DropdownMenu.Item
              className={itemClassName}
              onSelect={() => handlers.onMoveToFolder(book, null)}
            >
              Uncategorized
            </DropdownMenu.Item>
            {folderOptions.map((folder) => (
              <DropdownMenu.Item
                key={folder.id}
                className={`${itemClassName} truncate`}
                onSelect={() => handlers.onMoveToFolder(book, folder.id)}
              >
                {folder.name}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.SubContent>
        </DropdownMenu.Portal>
      </DropdownMenu.Sub>

      <DropdownMenu.Separator className={separatorClassName} />

      <DropdownMenu.Item
        className={itemClassName}
        onSelect={() => handlers.onDeleteBook(book)}
      >
        <Trash2 size={13} className="shrink-0 text-stone-500" />
        Move to trash
      </DropdownMenu.Item>
    </>
  );
}

/** Ellipsis-triggered actions menu for a gallery card. */
export function BookActionsMenu({
  book,
  folderOptions,
  handlers,
}: {
  book: Book;
  folderOptions: FolderOption[];
  handlers: BookActionsMenuHandlers;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="rounded-md p-1 text-stone-500 outline-none hover:bg-stone-200 data-[state=open]:bg-stone-200 dark:hover:bg-stone-800 dark:data-[state=open]:bg-stone-800"
          onClick={(event) => event.stopPropagation()}
          aria-label={`Actions for ${book.title}`}
        >
          <MoreVertical size={14} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={contentClassName}
          align="end"
          sideOffset={4}
          onClick={(event) => event.stopPropagation()}
        >
          <MenuItems
            book={book}
            folderOptions={folderOptions}
            handlers={handlers}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export type ContextMenuTarget = {
  book: Book;
  x: number;
  y: number;
};

/** Right-click context menu anchored to a screen position, reusing the same items. */
export function BookContextMenu({
  target,
  folderOptions,
  handlers,
  onClose,
}: {
  target: ContextMenuTarget | null;
  folderOptions: FolderOption[];
  handlers: BookActionsMenuHandlers;
  onClose: () => void;
}) {
  return (
    <DropdownMenu.Root
      open={target != null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DropdownMenu.Trigger
        aria-hidden
        style={{
          position: "fixed",
          left: target?.x ?? 0,
          top: target?.y ?? 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={contentClassName}
          align="start"
          sideOffset={2}
        >
          {target ? (
            <>
              <DropdownMenu.Label className={labelClassName}>
                {target.book.title}
              </DropdownMenu.Label>
              <MenuItems
                book={target.book}
                folderOptions={folderOptions}
                handlers={handlers}
              />
            </>
          ) : null}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
