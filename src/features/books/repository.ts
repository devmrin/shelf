import Fuse from 'fuse.js'
import { db } from '../../db/database'
import type {
  ActiveFolderId,
  Book,
  BookDraft,
  Folder,
  ReadingStatus,
  SortMode,
} from './types'
import { createId } from '../../utils/id'
import { searchBooks } from './search'

export type BookFilters = {
  rated?: boolean
  donate?: boolean
  statuses?: ReadingStatus[]
  categories?: string[]
  tags?: string[]
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
  rated: number
  donation: number
  reading: number
  completed: number
}

export type FolderWithCounts = Folder & { bookCount: number }

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

async function upsertTaxonomyValues(payload: { categories?: string[]; tags?: string[] }) {
  const categories = [...new Set((payload.categories ?? []).map((value) => value.trim()).filter(Boolean))]
  const tags = [...new Set((payload.tags ?? []).map((value) => value.trim()).filter(Boolean))]

  if (categories.length) {
    const existing = await db.categories
      .where('value')
      .anyOf(categories)
      .toArray()
    const existingValues = new Set(existing.map((entry) => entry.value))
    const now = Date.now()

    const fresh = categories
      .filter((value) => !existingValues.has(value))
      .map((value) => ({
        id: createId('category'),
        value,
        createdAt: now,
      }))

    if (fresh.length) {
      await db.categories.bulkPut(fresh)
    }
  }

  if (tags.length) {
    const existing = await db.tags
      .where('value')
      .anyOf(tags)
      .toArray()
    const existingValues = new Set(existing.map((entry) => entry.value))
    const now = Date.now()

    const fresh = tags
      .filter((value) => !existingValues.has(value))
      .map((value) => ({
        id: createId('tag'),
        value,
        createdAt: now,
      }))

    if (fresh.length) {
      await db.tags.bulkPut(fresh)
    }
  }
}

function sortBooks(books: Book[], sort: SortMode) {
  const cloned = [...books]

  cloned.sort((a, b) => {
    if (sort === 'created-desc') return b.createdAt - a.createdAt
    if (sort === 'updated-desc') return b.updatedAt - a.updatedAt
    if (sort === 'title-asc') return a.title.localeCompare(b.title)
    if (sort === 'author-asc') return (a.author ?? '').localeCompare(b.author ?? '')
    if (sort === 'rating-desc') return (b.rating ?? 0) - (a.rating ?? 0)
    return b.createdAt - a.createdAt
  })

  return cloned
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
    folderId: input.folderId,
    categories: input.categories ?? [],
    tags: input.tags ?? [],
    notes: input.notes,
    readyToDonate: Boolean(input.readyToDonate),
    rating: input.rating,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }

  await db.books.add(book)
  await upsertTaxonomyValues({ categories: book.categories, tags: book.tags })
  return book
}

export async function updateBook(id: string, patch: Partial<Book>) {
  await db.books.update(id, { ...patch, updatedAt: Date.now() })

  if (patch.categories || patch.tags) {
    await upsertTaxonomyValues({ categories: patch.categories, tags: patch.tags })
  }
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

export async function getTrashedBooks() {
  const books = await db.books
    .filter((book) => Boolean(book.deletedAt))
    .toArray()

  return books.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
}

function applyFolderScope(books: Book[], folderScope: ActiveFolderId | undefined) {
  const scope = folderScope ?? 'uncategorized'
  if (scope === 'uncategorized') {
    return books.filter((book) => book.folderId == null || book.folderId === '')
  }
  return books.filter((book) => book.folderId === scope)
}

export async function queryBooks(params: {
  search: string
  filters: BookFilters
  sort: SortMode
  folderScope?: ActiveFolderId
}) {
  const { search, filters, sort, folderScope } = params
  const books = await db.books.toArray()
  const now = Date.now()

  let filtered = books.filter((book) => filters.includeDeleted || !book.deletedAt)

  filtered = applyFolderScope(filtered, folderScope)

  if (filters.rated) filtered = filtered.filter((book) => (book.rating ?? 0) > 0)
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
  if (filters.tags?.length) {
    filtered = filtered.filter((book) =>
      (book.tags ?? []).some((tag) => filters.tags?.includes(tag)),
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
    filtered = searchBooks(filtered, search)
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
    rating?: number
    donate?: boolean
    folderId?: string | null
  },
) {
  await upsertTaxonomyValues({
    categories: patch.addCategory ? [patch.addCategory] : [],
    tags: patch.addTag ? [patch.addTag] : [],
  })

  const books = await db.books.bulkGet(ids)
  const updates = books
    .filter((book): book is Book => Boolean(book))
    .map((book) => {
      const categories = new Set(book.categories ?? [])
      const tags = new Set(book.tags ?? [])

      if (patch.addCategory?.trim()) categories.add(patch.addCategory.trim())
      if (patch.addTag?.trim()) tags.add(patch.addTag.trim())

      const changes: Partial<Book> & { updatedAt: number } = {
        categories: [...categories],
        tags: [...tags],
        rating: patch.rating ?? book.rating,
        readyToDonate: patch.donate ?? book.readyToDonate,
        updatedAt: Date.now(),
      }
      if (patch.folderId !== undefined) {
        changes.folderId = patch.folderId === null ? undefined : patch.folderId
      }

      return {
        key: book.id,
        changes,
      }
    })

  await db.books.bulkUpdate(updates)
}

export async function listFolders(): Promise<FolderWithCounts[]> {
  const [folders, books] = await Promise.all([
    db.folders.orderBy('sortOrder').toArray(),
    db.books.filter((book) => !book.deletedAt).toArray(),
  ])

  const countByFolderId = new Map<string, number>()
  for (const book of books) {
    const fid = book.folderId
    if (!fid) continue
    countByFolderId.set(fid, (countByFolderId.get(fid) ?? 0) + 1)
  }

  return folders.map((folder) => ({
    ...folder,
    bookCount: countByFolderId.get(folder.id) ?? 0,
  }))
}

export async function createFolder(name: string) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Folder name is required')

  const existing = await db.folders.where('name').equals(trimmed).first()
  if (existing) throw new Error(`A folder named "${trimmed}" already exists`)

  const last = await db.folders.orderBy('sortOrder').last()
  const sortOrder = (last?.sortOrder ?? -1) + 1
  const now = Date.now()
  const folder: Folder = {
    id: createId('folder'),
    name: trimmed,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  }
  await db.folders.add(folder)
  return folder
}

export async function renameFolder(id: string, name: string) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Folder name is required')

  const clashes = await db.folders.where('name').equals(trimmed).toArray()
  if (clashes.some((row) => row.id !== id)) {
    throw new Error(`A folder named "${trimmed}" already exists`)
  }

  await db.folders.update(id, { name: trimmed, updatedAt: Date.now() })
}

export async function deleteFolder(id: string) {
  await db.transaction('rw', db.books, db.folders, async () => {
    const booksInFolder = await db.books.filter((book) => book.folderId === id).toArray()
    await db.books.bulkUpdate(
      booksInFolder.map((book) => ({
        key: book.id,
        changes: { folderId: undefined, updatedAt: Date.now() },
      })),
    )
    await db.folders.delete(id)
  })
}

export async function moveBooksToFolder(ids: string[], folderId: string | null) {
  if (folderId) {
    const folder = await db.folders.get(folderId)
    if (!folder) throw new Error('Folder not found')
  }

  const books = await db.books.bulkGet(ids)
  const updates = books
    .filter((book): book is Book => Boolean(book))
    .map((book) => ({
      key: book.id,
      changes: {
        folderId: folderId ?? undefined,
        updatedAt: Date.now(),
      },
    }))

  if (updates.length) {
    await db.books.bulkUpdate(updates)
  }
}

export async function countUncategorizedBooks() {
  const books = await db.books.filter((book) => !book.deletedAt).toArray()
  return books.filter((book) => book.folderId == null || book.folderId === '').length
}

export async function getCategoryTagOptions() {
  const [categoryRows, tagRows, books] = await Promise.all([
    db.categories.toArray(),
    db.tags.toArray(),
    db.books.filter((book) => !book.deletedAt).toArray(),
  ])

  const categorySet = new Set(categoryRows.map((entry) => entry.value))
  const tagSet = new Set(tagRows.map((entry) => entry.value))

  for (const book of books) {
    for (const category of book.categories ?? []) {
      if (category.trim()) categorySet.add(category.trim())
    }
    for (const tag of book.tags ?? []) {
      if (tag.trim()) tagSet.add(tag.trim())
    }
  }

  return {
    categories: [...categorySet].sort((a, b) => a.localeCompare(b)),
    tags: [...tagSet].sort((a, b) => a.localeCompare(b)),
  }
}

export async function collectionStats(): Promise<CollectionStats> {
  const books = await db.books
    .filter((book) => !book.deletedAt)
    .toArray()

  return {
    total: books.length,
    rated: books.filter((book) => (book.rating ?? 0) > 0).length,
    donation: books.filter((book) => book.readyToDonate).length,
    reading: books.filter((book) => (book.status ?? 'unread') === 'reading').length,
    completed: books.filter((book) => (book.status ?? 'unread') === 'completed').length,
  }
}

export async function exportJson() {
  const [books, folders, categories, tags, settings] = await Promise.all([
    db.books.toArray(),
    db.folders.toArray(),
    db.categories.toArray(),
    db.tags.toArray(),
    db.settings.toArray(),
  ])

  return {
    version: 2,
    exportedAt: Date.now(),
    books,
    folders,
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
    folders?: Folder[]
    categories?: { id: string; value: string; createdAt: number }[]
    tags?: { id: string; value: string; createdAt: number }[]
    settings?: { key: string; value: string; updatedAt: number }[]
  }

  if (raw.folders) await db.folders.bulkPut(raw.folders)
  if (raw.books) await db.books.bulkPut(raw.books)
  if (raw.categories) await db.categories.bulkPut(raw.categories)
  if (raw.tags) await db.tags.bulkPut(raw.tags)
  if (raw.settings) await db.settings.bulkPut(raw.settings)
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
