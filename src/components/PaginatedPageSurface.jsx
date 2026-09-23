import * as React from 'react'
import { normalizePageLayout } from '@/data/pageLayout'
import { cn } from '@/lib/utils'

/** Screen px for manuscript pages (96dpi × scale). */
export function pageMetrics(layout, scale = 0.82) {
  const L = normalizePageLayout(layout)
  const pxPerIn = 96 * scale
  const width = L.width_in * pxPerIn
  const height = L.height_in * pxPerIn
  const margin = L.margin_in * pxPerIn
  return {
    layout: L,
    scale,
    width,
    height,
    margin,
    gap: 10,
    fontSize: Math.round(16 * (L.font_scale || 1) * Math.min(1, scale / 0.75)),
    contentHeight: Math.max(40, height - 2 * margin),
  }
}

/**
 * Docs-style pages: one continuous paper with a thin desk gap
 * marking each page cut-off so you can see where pages end.
 */
export function PaginatedPageSurface({
  layout,
  scale = 0.82,
  className,
  deskClassName,
  minPages = 1,
  onPageCount,
  children,
}) {
  const m = pageMetrics(layout, scale)
  const measureRef = React.useRef(null)
  const [pages, setPages] = React.useState(Math.max(1, minPages))

  React.useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return undefined

    const measure = () => {
      const contentH = el.scrollHeight
      const n = Math.max(1, Math.ceil(contentH / m.height), minPages)
      setPages((prev) => (prev === n ? prev : n))
      onPageCount?.(n)
    }

    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    const mo = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(measure)
      : null
    mo?.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      ro?.disconnect()
      mo?.disconnect()
    }
  }, [m.height, m.width, m.margin, minPages, onPageCount, layout])

  // Continuous paper height (no extra gap space — gaps overlay the cut lines)
  const paperHeight = Math.max(pages * m.height, m.height)

  return (
    <div
      className={cn(
        'qd-page-desk w-full overflow-auto rounded-lg border',
        deskClassName,
        className
      )}
    >
      <div
        className="relative mx-auto my-4 sm:my-6"
        style={{ width: Math.min(m.width, 900), maxWidth: '100%' }}
      >
        <div className="relative" style={{ minHeight: paperHeight, width: '100%' }}>
          {/* Paper sheet */}
          <div
            aria-hidden
            className="qd-page-sheet absolute inset-x-0 top-0 border border-black/10 shadow-sm"
            style={{
              height: paperHeight,
              background: 'var(--qd-paper, #faf8f5)',
            }}
          />

          {/* Hairline page rules + thin desk gaps at each cut-off */}
          {Array.from({ length: Math.max(0, pages - 1) }, (_, i) => {
            const y = (i + 1) * m.height
            return (
              <div
                key={`gap-${i}`}
                aria-hidden
                className="qd-page-gap absolute z-20 pointer-events-none"
                style={{
                  left: -1,
                  right: -1,
                  top: y - m.gap / 2,
                  height: m.gap,
                  background: 'var(--qd-desk, color-mix(in oklab, var(--background) 88%, var(--muted) 12%))',
                  boxShadow:
                    '0 -1px 0 color-mix(in oklab, var(--foreground) 12%, transparent), 0 1px 0 color-mix(in oklab, var(--foreground) 12%, transparent)',
                }}
              />
            )
          })}

          <div
            ref={measureRef}
            className="qd-page-content relative z-10"
            style={{
              minHeight: m.height,
              padding: m.margin,
              fontSize: m.fontSize,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
