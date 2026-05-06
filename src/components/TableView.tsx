import { useMemo, useRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Heart } from "lucide-react";
import type { Book } from "../features/books/types";

type Props = {
  books: Book[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpenBook: (book: Book) => void;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (value: Updater<VisibilityState>) => void;
};

const columnHelper = createColumnHelper<Book>();

export function TableView(props: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => <span className="text-xs">Pick</span>,
        size: 42,
        cell: (ctx) => (
          <input
            type="checkbox"
            checked={props.selectedIds.includes(ctx.row.original.id)}
            onChange={() => props.onToggleSelect(ctx.row.original.id)}
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
    ],
    [props.selectedIds, props.onToggleSelect],
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

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 46,
    overscan: 12,
  });

  return (
    <div className="px-3 pb-3 pt-2 sm:px-4">
      <div className="mb-2 flex flex-wrap gap-2">
        {table
          .getAllLeafColumns()
          .filter((column) => column.id !== "select")
          .map((column) => (
            <label
              key={column.id}
              className="inline-flex items-center gap-1 text-xs"
            >
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={column.getToggleVisibilityHandler()}
              />
              {column.id}
            </label>
          ))}
      </div>

      <div
        ref={containerRef}
        className="h-[calc(100vh-10rem)] overflow-auto rounded-xl border border-stone-200 dark:border-stone-800"
      >
        <table className="w-full border-collapse text-sm">
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
          <tbody
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;

              return (
                <tr
                  key={row.id}
                  className="absolute left-0 right-0 border-b border-stone-100 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                  onDoubleClick={() => props.onOpenBook(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-2 py-2 align-middle text-stone-700 dark:text-stone-200"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
