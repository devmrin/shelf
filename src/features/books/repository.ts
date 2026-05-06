import Fuse from 'fuse.js'
import { db } from '../../db/database'
import type { Book, BookDraft, ReadingStatus, SortMode } from './types'
import { createId } from '../../utils/id'

export type BookFilters = {
  favorites?: boolean
  donate?: boolean
  statuses?: ReadingStatus[]
  categories?: string[]
  hasImage?: boolean
  missingMetadata?: boolean
  recentDays?: number
  includeDeleted?: boolean
}

export type DuplicateMatch = {
  id: string
  title: string
  author?: string
  score?: number
}

export type CollectionStats = {
  total: number
  favorites: number
  donation: number
  reading: number
  completed: number
}

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

function sortBooks(books: Book[], sort: SortMode) {
  const cloned = [...books]

  cloned.sort((a, b) => {
    if (sort === 'created-desc') return b.createdAt - a.createdAt
    if (sort === 'updated-desc') return b.updatedAt - a.updatedAt
    if (sort === 'title-asc') return a.title.localeCompare(b.title)
    if (sort === 'author-asc') return (a.author ?? '').localeCompare(b.author ?? '')
    if (sort === 'rating-desc') return (b.rating ?? 0) - (a.rating ?? 0)
    if (sort === 'favorites-first') {
      if (a.isFavorite !== b.isFavorite) return Number(b.isFavorite) - Number(a.isFavorite)
      return b.updatedAt - a.updatedAt
    }
    return b.createdAt - a.createdAt
  })

  return cloned
}

export async function seedSampleData() {
  const count = await db.books.count()
  if (count > 0) return

  const now = Date.now()
  await db.books.bulkPut([
    {
      id: createId('book'),
      title: 'The Left Hand of Darkness',
      author: 'Ursula K. Le Guin',
      categories: ['Science Fiction'],
      tags: ['classic', 'winter'],
      isFavorite: true,
      readyToDonate: false,
      status: 'completed',
      rating: 5,
      createdAt: now - 86400000 * 8,
      updatedAt: now - 86400000 * 2,
    },
    {
      id: createId('book'),
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      categories: ['Psychology'],
      tags: ['non-fiction'],
      isFavorite: false,
      readyToDonate: false,
      status: 'reading',
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000,
    },
  ])
}

export async function addBook(input: BookDraft) {
  const now = Date.now()
  const book: Book = {
    id: createId('book'),
    title: input.title?.trim() ?? 'Untitled',
    author: input.author?.trim(),
    coverImage: input.coverImage,
    additionalImages: input.additionalImages ?? [],
    isbn: input.isbn?.trim(),
    publisher: input.publisher?.trim(),
    publishedYear: input.publishedYear,
    categories: input.categories ?? [],
    tags: input.tags ?? [],
    notes: input.notes,
    isFavorite: Boolean(input.isFavorite),
    readyToDonate: Boolean(input.readyToDonate),
    rating: input.rating,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }

  await db.books.add(book)
  return book
}

export async function updateBook(id: string, patch: Partial<Book>) {
  await db.books.update(id, { ...patch, updatedAt: Date.now() })
}

export async function softDeleteBooks(ids: string[]) {
  const deletedAt = Date.now()
  await db.books.bulkUpdate(ids.map((id) => ({ key: id, changes: { deletedAt } })))
}

export async function restoreBooks(ids: string[]) {
  await db.books.bulkUpdate(ids.map((id) => ({ key: id, changes: { deletedAt: undefined } })))
}

export async function permanentlyDeleteBooks(ids: string[]) {
  await db.books.bulkDelete(ids)
}

export async function upsertDraft(key: string, payload: string) {
  await db.drafts.put({ key, payload, updatedAt: Date.now() })
}

export async function getDraft(key: string) {
  return db.drafts.get(key)
}

export async function clearDraft(key: string) {
  await db.drafts.delete(key)
}

export async function setSetting(key: string, value: string) {
  await db.settings.put({ key, value, updatedAt: Date.now() })
}

export async function getSetting(key: string) {
  return db.settings.get(key)
}

export async function getAllBooks() {
  return db.books.orderBy('updatedAt').reverse().toArray()
}

export async function queryBooks(params: {
  search: string
  filters: BookFilters
  sort: SortMode
}) {
  const { search, filters, sort } = params
  const books = await db.books.toArray()
  const now = Date.now()

  let filtered = books.filter((book) => filters.includeDeleted || !book.deletedAt)

  if (filters.favorites) filtered = filtered.filter((book) => book.isFavorite)
  if (filters.donate) filtered = filtered.filter((book) => book.readyToDonate)
  if (filters.statuses?.length) {
    filtered = filtered.filter((book) =>
      filters.statuses?.includes((book.status ?? 'unread') as ReadingStatus),
    )
  }
  if (filters.categories?.length) {
    filtered = filtered.filter((book) =>
      (book.categories ?? []).some((category) => filters.categories?.includes(category)),
    )
  }
  if (filters.hasImage) filtered = filtered.filter((book) => Boolean(book.coverImage))
  if (filters.missingMetadata) {
    filtered = filtered.filter(
      (book) => !book.author || !book.isbn || !(book.categories ?? []).length,
    )
  }
  if (filters.recentDays) {
    const minTime = now - filters.recentDays * 86400000
    filtered = filtered.filter((book) => book.createdAt >= minTime)
  }

  if (search.trim()) {
    const fuse = new Fuse(filtered, {
      includeScore: true,
      threshold: 0.32,
      keys: ['title', 'author', 'isbn', 'tags', 'notes'],
    })
    filtered = fuse.search(search).map((entry) => entry.item)
  }

  return sortBooks(filtered, sort)
}

export async function detectDuplicates(input: Pick<Book, 'title' | 'author'>) {
  const title = normalize(input.title)
  const author = normalize(input.author)
  if (!title) return []

  const books = await db.books
    .filter((book) => !book.deletedAt)
    .toArray()

  const fuse = new Fuse(books, {
    includeScore: true,
    threshold: 0.25,
    keys: ['title', 'author'],
  })

  const query = `${title} ${author}`.trim()
  return fuse
    .search(query)
    .slice(0, 5)
    .map((entry) => ({
      id: entry.item.id,
      title: entry.item.title,
      author: entry.item.author,
      score: entry.score,
    }))
}

export async function bulkEditBooks(
  ids: string[],
  patch: {
    addCategory?: string
    addTag?: string
    favorite?: boolean
    donate?: boolean
  },
) {
  const books = await db.books.bulkGet(ids)
  const updates = books
    .filter((book): book is Book => Boolean(book))
    .map((book) => {
      const categories = new Set(book.categories ?? [])
      const tags = new Set(book.tags ?? [])

      if (patch.addCategory?.trim()) categories.add(patch.addCategory.trim())
      if (patch.addTag?.trim()) tags.add(patch.addTag.trim())

      return {
        key: book.id,
        changes: {
          categories: [...categories],
          tags: [...tags],
          isFavorite: patch.favorite ?? book.isFavorite,
          readyToDonate: patch.donate ?? book.readyToDonate,
          updatedAt: Date.now(),
        },
      }
    })

  await db.books.bulkUpdate(updates)
}

export async function collectionStats(): Promise<CollectionStats> {
  const books = await db.books
    .filter((book) => !book.deletedAt)
    .toArray()

  return {
    total: books.length,
    favorites: books.filter((book) => book.isFavorite).length,
    donation: books.filter((book) => book.readyToDonate).length,
    reading: books.filter((book) => (book.status ?? 'unread') === 'reading').length,
    completed: books.filter((book) => (book.status ?? 'unread') === 'completed').length,
  }
}

export async function exportJson() {
  const [books, categories, tags, settings] = await Promise.all([
    db.books.toArray(),
    db.categories.toArray(),
    db.tags.toArray(),
    db.settings.toArray(),
  ])

  return {
    version: 1,
    exportedAt: Date.now(),
    books,
    categories,
    tags,
    settings,
  }
}

export async function importJson(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid backup payload')
  }

  const raw = payload as {
    books?: Book[]
    categories?: { id: string; value: string; createdAt: number }[]
    tags?: { id: string; value: string; createdAt: number }[]
    settings?: { key: string; value: string; updatedAt: number }[]
  }

  await db.transaction('rw', db.books, db.categories, db.tags, db.settings, async () => {
    if (raw.books) await db.books.bulkPut(raw.books)
    if (raw.categories) await db.categories.bulkPut(raw.categories)
    if (raw.tags) await db.tags.bulkPut(raw.tags)
    if (raw.settings) await db.settings.bulkPut(raw.settings)
  })
}

export async function estimateStorage() {
  if (!('storage' in navigator) || !navigator.storage.estimate) {
    return { used: 0, quota: 0, percent: 0 }
  }

  const result = await navigator.storage.estimate()
  const used = result.usage ?? 0
  const quota = result.quota ?? 0
  return {
    used,
    quota,
    percent: quota ? Math.round((used / quota) * 100) : 0,
  }
}
