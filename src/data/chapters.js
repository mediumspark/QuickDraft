/** Chapter helpers for drafts / forum posts */

export function newChapterId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `ch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createChapter(title = 'Chapter 1', body = '', sortOrder = 0) {
  return {
    id: newChapterId(),
    title: title || `Chapter ${sortOrder + 1}`,
    sort_order: sortOrder,
    body: body || '',
  }
}

export function normalizeChapters(chapters, fallbackBody = '') {
  if (Array.isArray(chapters) && chapters.length > 0) {
    return chapters
      .map((c, i) => ({
        id: c.id || newChapterId(),
        title: c.title || `Chapter ${i + 1}`,
        sort_order: typeof c.sort_order === 'number' ? c.sort_order : i,
        body: c.body ?? '',
      }))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c, i) => ({ ...c, sort_order: i }))
  }
  return [createChapter('Chapter 1', fallbackBody || '', 0)]
}

export function flattenChaptersBody(chapters) {
  return normalizeChapters(chapters)
    .map((c) => {
      const title = c.title ? `<h2>${escapeHtml(c.title)}</h2>` : ''
      return `${title}${c.body || ''}`
    })
    .join('')
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function reorderChapters(chapters, fromIndex, toIndex) {
  const list = normalizeChapters(chapters)
  if (
    fromIndex < 0
    || toIndex < 0
    || fromIndex >= list.length
    || toIndex >= list.length
    || fromIndex === toIndex
  ) {
    return list
  }
  const next = [...list]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next.map((c, i) => ({ ...c, sort_order: i }))
}
