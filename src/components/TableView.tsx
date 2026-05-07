import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import { Heart, Pencil, Trash2 } from "lucide-react";
import type { Book } from "../features/books/types";
import { RadixCheckbox } from "./RadixCheckbox";

type Props = {
  books: Book[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpenBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
  onBulkDelete: () => Promise<void>;
  onBulkFavorite: () => Promise<void>;
  onBulkDonate: () => Promise<void>;
  onBulkAddCategory: (value: string) => Promise<void>;
  onBulkAddTag: (value: string) => Promise<void>;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (value: Updater<VisibilityState>) => void;
};

const columnHelper = createColumnHelper<Book>();

export function TableView(props: Props) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => <span className="text-xs">Pick</span>,
        size: 42,
        cell: (ctx) => (
          <RadixCheckbox
            checked={props.selectedIds.includes(ctx.row.original.id)}
            onCheckedChange={() => props.onToggleSelect(ctx.row.original.id)}
            aria-label={`Select ${ctx.row.original.title}`}
          />
        ),
      }),
      columnHelper.accessor("coverImage", {
        header: "Cover",
        size: 76,
        cell: (ctx) =>
          ctx.getValue() ? (
            <img
              src={ctx.getValue()}
              alt="Cover"
              className="h-10 w-8 rounded object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-xs text-stone-400">-</span>
          ),
      }),
      columnHelper.accessor("title", { header: "Title", size: 220 }),
      columnHelper.accessor("author", { header: "Author", size: 180 }),
      columnHelper.accessor((book) => (book.categories ?? [])[0] ?? "-", {
        id: "category",
        header: "Category",
        size: 140,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        size: 120,
        cell: (ctx) => (
          <span className="capitalize">{ctx.getValue() ?? "unread"}</span>
        ),
      }),
      columnHelper.accessor("isFavorite", {
        header: "Favorite",
        size: 90,
        cell: (ctx) =>
          ctx.getValue() ? (
            <Heart size={14} className="fill-amber-400 text-amber-500" />
          ) : (
            "No"
          ),
      }),
      columnHelper.accessor("readyToDonate", {
        header: "Donate",
        size: 90,
        cell: (ctx) => (ctx.getValue() ? "Yes" : "No"),
      }),
      columnHelper.accessor("createdAt", {
        header: "Added",
        size: 150,
        cell: (ctx) => new Date(ctx.getValue()).toLocaleDateString(),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        size: 120,
        cell: (ctx) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
              onClick={() => props.onEditBook(ctx.row.original)}
              aria-label={`Edit ${ctx.row.original.title}`}
            >
              <Pencil size={14} className="text-stone-500" />
            </button>
            <button
              type="button"
              className="rounded p-1 hover:bg-stone-200 dark:hover:bg-stone-800"
              onClick={() => props.onDeleteBook(ctx.row.original)}
              aria-label={`Delete ${ctx.row.original.title}`}
            >
              <Trash2 size={14} className="text-stone-500" />
            </button>
          </div>
        ),
      }),
    ],
    [
      props.selectedIds,
      props.onDeleteBook,
      props.onEditBook,
      props.onToggleSelect,
    ],
  );

  const table = useReactTable({
    data: props.books,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    state: {
      columnVisibility: props.columnVisibility,
    },
    onColumnVisibilityChange: props.onColumnVisibilityChange,
  });

  const rows = table.getRowModel().rows;
  const selectedCount = props.selectedIds.length;

  return (
    <div className="flex h-full min-h-0 flex-col px-3 pb-3 pt-2 sm:px-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <details className="group relative">
          <summary className="cursor-pointer list-none rounded-md border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800">
            Visibility
          </summary>
          <div className="absolute left-0 top-full z-30 mt-1 min-w-44 rounded-lg border border-stone-200 bg-stone-50 p-2 shadow-lg dark:border-stone-700 dark:bg-stone-900">
            <div className="flex flex-col gap-1">
              {table
                .getAllLeafColumns()
                .filter((column) => column.id !== "select")
                .map((column) => (
                  <label
                    key={column.id}
                    className="inline-flex items-center gap-2 text-xs"
                  >
                    <RadixCheckbox
                      checked={column.getIsVisible()}
                      onCheckedChange={() => column.toggleVisibility()}
                      ariaLabel={`Toggle ${column.id} column`}
                    />
                    <span className="capitalize">{column.id}</span>
                  </label>
                ))}
            </div>
          </div>
        </details>

        {selectedCount > 0 ? (
          <section className="rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs dark:border-stone-700 dark:bg-stone-900">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
              Bulk Actions ({selectedCount})
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <button
                className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                type="button"
                onClick={() => void props.onBulkFavorite()}
              >
                Favorite
              </button>
              <button
                className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                type="button"
                onClick={() => void props.onBulkDonate()}
              >
                Donate
              </button>
              <button
                className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                type="button"
                onClick={() => void props.onBulkDelete()}
              >
                Trash
              </button>
              <button
                className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                type="button"
                onClick={() => {
                  const value = window.prompt(
                    "Category to add to selected books",
                  );
                  if (value) void props.onBulkAddCategory(value);
                }}
              >
                Add Category
              </button>
              <button
                className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                type="button"
                onClick={() => {
                  const value = window.prompt("Tag to add to selected books");
                  if (value) void props.onBulkAddTag(value);
                }}
              >
                Add Tag
              </button>
            </div>
          </section>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="sticky top-0 z-20 bg-stone-100 dark:bg-stone-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="border-b border-stone-200 px-2 py-2 text-left font-medium text-stone-700 dark:border-stone-800 dark:text-stone-300"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-stone-100 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"
                onDoubleClick={() => props.onOpenBook(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="px-2 py-2 align-middle text-stone-700 dark:text-stone-200"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
