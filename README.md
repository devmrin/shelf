# Shelf

Shelf is a local-first web app for cataloging physical books at home.

It is optimized for rapid ingestion and large personal collections, and works fully offline using IndexedDB + PWA caching.

## Tech stack

- React + TypeScript + Vite
- Dexie.js (IndexedDB)
- TailwindCSS
- TanStack Table + TanStack Virtual
- Zustand
- React Hook Form
- Framer Motion
- Vite PWA plugin

## Setup

```bash
pnpm install
pnpm dev
```

Build and preview:

```bash
pnpm build
pnpm preview
```

## IndexedDB schema

Shelf uses one Dexie database named `shelf-db` with these tables:

- `books`
  - schema: `id, title, author, isbn, *categories, *tags, isFavorite, readyToDonate, status, createdAt, updatedAt, deletedAt`
- `categories`
  - schema: `id, value, createdAt`
- `tags`
  - schema: `id, value, createdAt`
- `settings`
  - schema: `key, updatedAt`
- `drafts`
  - schema: `key, updatedAt`

Books are soft-deleted using `deletedAt` to support undo/trash behavior.

## Features implemented

- Instant add mode (title + author + Enter)
- Duplicate detection (fuzzy title/author)
- Draft autosave for form state
- Image upload options:
  - camera capture
  - drag/drop
  - clipboard paste
  - multi-image input
- Client-side image optimization/compression
- Gallery view (virtualized)
- Table view (TanStack Table + virtualized rows)
- Quick filters and global fuzzy search
- Bulk actions on selected books
- JSON export/import backup
- Storage usage indicator
- Soft-delete + undo toast
- Book detail drawer
- Keyboard shortcuts
- Persistent preferences (view/filter/theme/columns)
- PWA installability + offline behavior
- Light, dark, and system theme modes

## Project structure

```txt
src/
  components/
  features/books/
  db/
  hooks/
  stores/
  utils/
  pages/
```

## Keyboard shortcuts

- `/` focus search
- `n` focus new book input / open drawer on mobile
- `g` gallery view
- `t` table view
- `f` toggle favorite for single selected row
- `Delete` move selected books to trash

## Notes

- Data stays local in the browser.
- No authentication is required.
- JSON backup/restore is available from the sidebar.
