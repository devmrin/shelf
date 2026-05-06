import Dexie, { type EntityTable } from 'dexie'
import type { Book } from '../features/books/types'

export type CategoryEntity = {
  id: string
  value: string
  createdAt: number
}

export type TagEntity = {
  id: string
  value: string
  createdAt: number
}

export type SettingsEntity = {
  key: string
  value: string
  updatedAt: number
}

export type DraftEntity = {
  key: string
  payload: string
  updatedAt: number
}

class ShelfDatabase extends Dexie {
  books!: EntityTable<Book, 'id'>
  categories!: EntityTable<CategoryEntity, 'id'>
  tags!: EntityTable<TagEntity, 'id'>
  settings!: EntityTable<SettingsEntity, 'key'>
  drafts!: EntityTable<DraftEntity, 'key'>

  constructor() {
    super('shelf-db')

    this.version(1).stores({
      books:
        'id, title, author, isbn, *categories, *tags, isFavorite, readyToDonate, status, createdAt, updatedAt, deletedAt',
      categories: 'id, value, createdAt',
      tags: 'id, value, createdAt',
      settings: 'key, updatedAt',
      drafts: 'key, updatedAt',
    })
  }
}

export const db = new ShelfDatabase()
