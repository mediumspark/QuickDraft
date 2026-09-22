/** Book page layout presets and page-count estimation */

export const PAGE_PRESETS = {
  small: {
    preset: 'small',
    label: 'Small book',
    width_in: 5,
    height_in: 8,
    margin_in: 0.6,
    font_scale: 1,
  },
  standard: {
    preset: 'standard',
    label: 'Standard book',
    width_in: 6,
    height_in: 9,
    margin_in: 0.75,
    font_scale: 1,
  },
  large: {
    preset: 'large',
    label: 'Large book',
    width_in: 8.5,
    height_in: 11,
    margin_in: 1,
    font_scale: 1,
  },
}

export const DEFAULT_PAGE_LAYOUT = { ...PAGE_PRESETS.standard }

export function normalizePageLayout(layout) {
  const presetKey = layout?.preset && PAGE_PRESETS[layout.preset] ? layout.preset : 'standard'
  const base = PAGE_PRESETS[presetKey]
  return {
    preset: layout?.preset === 'custom' ? 'custom' : presetKey,
    width_in: Number(layout?.width_in) > 0 ? Number(layout.width_in) : base.width_in,
    height_in: Number(layout?.height_in) > 0 ? Number(layout.height_in) : base.height_in,
    margin_in: Number(layout?.margin_in) >= 0 ? Number(layout.margin_in) : base.margin_in,
    font_scale: Number(layout?.font_scale) > 0 ? Number(layout.font_scale) : 1,
  }
}

export function layoutFromPreset(presetKey) {
  const p = PAGE_PRESETS[presetKey] || PAGE_PRESETS.standard
  return {
    preset: p.preset,
    width_in: p.width_in,
    height_in: p.height_in,
    margin_in: p.margin_in,
    font_scale: p.font_scale,
  }
}

/** Usable text area in inches */
export function usableAreaInches(layout) {
  const L = normalizePageLayout(layout)
  const w = Math.max(0.5, L.width_in - 2 * L.margin_in)
  const h = Math.max(0.5, L.height_in - 2 * L.margin_in)
  return { width: w, height: h, area: w * h }
}

/**
 * Estimate manuscript pages from plain text.
 * Baseline: ~250 words per page on a standard 6×9 with ~0.75" margins.
 */
export function estimatePageCount(plainText, layout) {
  const words = (plainText || '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  if (words === 0) return 1

  const L = normalizePageLayout(layout)
  const { area } = usableAreaInches(L)
  const standardArea = usableAreaInches(PAGE_PRESETS.standard).area
  const areaFactor = area / standardArea
  const wordsPerPage = Math.max(80, Math.round((250 * areaFactor) / (L.font_scale || 1)))
  return Math.max(1, Math.ceil(words / wordsPerPage))
}

export function plainFromHtml(html) {
  if (!html) return ''
  if (typeof document === 'undefined') {
    return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const el = document.createElement('div')
  el.innerHTML = html
  return (el.textContent || el.innerText || '').replace(/\u00a0/g, ' ')
}

export function estimateChaptersPageCount(chapters, layout) {
  const plain = (chapters || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((c) => `${c.title || ''}\n${plainFromHtml(c.body || '')}`)
    .join('\n\n')
  return estimatePageCount(plain, layout)
}

export function pageBoxStyle(layout, scale = 1) {
  const L = normalizePageLayout(layout)
  const pxPerIn = 96 * scale
  return {
    width: `${L.width_in * pxPerIn}px`,
    minHeight: `${L.height_in * pxPerIn}px`,
    padding: `${L.margin_in * pxPerIn}px`,
    fontSize: `${(L.font_scale || 1) * 16}px`,
  }
}
