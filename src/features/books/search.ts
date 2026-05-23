import Fuse from 'fuse.js';
import type { FuseOptionKey } from 'fuse.js';
import type { Book } from './types';

/** Central registry: add entries here when new searchable Book metadata is introduced. */
export const SEARCHABLE_KEYS: FuseOptionKey<Book>[] = [
  { name: 'title', weight: 0.35 },
  { name: 'author', weight: 0.25 },
  'isbn',
  {
    name: 'categories',
    getFn: (book: Book) => (book.categories ?? []).join(' '),
  },
  {
    name: 'tags',
    getFn: (book: Book) => (book.tags ?? []).join(' '),
  },
  'publisher',
  {
    name: 'publishedYear',
    getFn: (book: Book) =>
      book.publishedYear != null ? String(book.publishedYear) : '',
  },
  {
    name: 'status',
    getFn: (book: Book) => book.status ?? 'unread',
  },
  {
    name: 'rating',
    getFn: (book: Book) =>
      book.rating != null ? String(book.rating) : '',
  },
  'notes',
];

export function searchBooks(books: Book[], query: string): Book[] {
  const trimmed = query.trim();
  if (!trimmed) return books;

  const fuse = new Fuse(books, {
    keys: SEARCHABLE_KEYS,
    includeScore: true,
    threshold: 0.32,
  });

  return fuse.search(trimmed).map((entry) => entry.item);
}
