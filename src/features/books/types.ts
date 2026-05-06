export type ReadingStatus = 'unread' | 'reading' | 'completed'

export type Book = {
  id: string
  title: string
  author?: string
  coverImage?: string
  additionalImages?: string[]
  isbn?: string
  publisher?: string
  publishedYear?: number
  categories?: string[]
  tags?: string[]
  notes?: string
  isFavorite: boolean
  readyToDonate: boolean
  rating?: number
  status?: ReadingStatus
  createdAt: number
  updatedAt: number
  deletedAt?: number
}

export type BookDraft = Partial<Book> & {
  title?: string
  author?: string
}

export type ViewMode = 'gallery' | 'table'

export type SortMode =
  | 'created-desc'
  | 'updated-desc'
  | 'title-asc'
  | 'author-asc'
  | 'rating-desc'
  | 'favorites-first'

export type QuickFilter =
  | 'favorites'
  | 'donate'
  | 'unread'
  | 'reading'
  | 'completed'
  | 'has-image'
  | 'missing-metadata'
