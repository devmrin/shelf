/** Custom MIME type for dragging book IDs between shelf views and folder nav */

export const SHELF_BOOK_DRAG_MIME = 'application/x-shelf-book-ids'

export function writeShelfBookDrag(dataTransfer: DataTransfer, ids: string[]) {
  dataTransfer.setData(SHELF_BOOK_DRAG_MIME, JSON.stringify(ids))
  dataTransfer.effectAllowed = 'move'
}

export function readShelfBookDrag(dataTransfer: DataTransfer): string[] {
  try {
    const raw = dataTransfer.getData(SHELF_BOOK_DRAG_MIME)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}
