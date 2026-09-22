import * as React from 'react'
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PAGE_PRESETS, layoutFromPreset, normalizePageLayout } from '@/data/pageLayout'
import { createChapter, reorderChapters } from '@/data/chapters'
import { cn } from '@/lib/utils'

export function ChapterSidebar({
  chapters,
  activeIndex,
  onSelect,
  onChangeTitle,
  onAdd,
  onRemove,
  onMove,
}) {
  return (
    <aside className="w-full sm:w-52 shrink-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chapters</h2>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={onAdd} title="Add chapter">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ul className="space-y-1">
        {chapters.map((ch, i) => (
          <li key={ch.id}>
            <div
              className={cn(
                'rounded-lg border p-2 transition-colors',
                i === activeIndex ? 'border-primary bg-accent' : 'border-border hover:border-primary/30'
              )}
            >
              <button
                type="button"
                className="w-full text-left text-sm font-medium truncate"
                onClick={() => onSelect(i)}
              >
                {ch.title || `Chapter ${i + 1}`}
              </button>
              {i === activeIndex && (
                <div className="mt-2 space-y-1.5">
                  <Input
                    value={ch.title}
                    onChange={(e) => onChangeTitle(i, e.target.value)}
                    className="h-8 text-xs"
                    placeholder={`Chapter ${i + 1}`}
                  />
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-1.5" disabled={i === 0} onClick={() => onMove(i, i - 1)}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-1.5" disabled={i >= chapters.length - 1} onClick={() => onMove(i, i + 1)}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-1.5 text-destructive ml-auto"
                      disabled={chapters.length <= 1}
                      onClick={() => onRemove(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export function PageLayoutControls({ layout, pageCount, onChange }) {
  const L = normalizePageLayout(layout)
  const presetValue = L.preset === 'custom' || !PAGE_PRESETS[L.preset] ? 'custom' : L.preset

  return (
    <div className="rounded-xl border bg-card/60 p-3 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1 min-w-[10rem]">
          <Label className="text-xs">Page size</Label>
          <Select
            value={presetValue}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'custom') {
                onChange({ ...L, preset: 'custom' })
              } else {
                onChange(layoutFromPreset(v))
              }
            }}
          >
            {Object.values(PAGE_PRESETS).map((p) => (
              <option key={p.preset} value={p.preset}>{p.label} ({p.width_in}×{p.height_in}&quot;)</option>
            ))}
            <option value="custom">Custom</option>
          </Select>
        </div>
        <p className="text-sm tabular-nums">
          <span className="font-semibold text-foreground">{pageCount}</span>
          <span className="text-muted-foreground"> page{pageCount === 1 ? '' : 's'}</span>
          <span className="text-muted-foreground"> · 5 pts/page when published</span>
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ['width_in', 'Width (in)'],
          ['height_in', 'Height (in)'],
          ['margin_in', 'Margin (in)'],
          ['font_scale', 'Font scale'],
        ].map(([key, label]) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
              type="number"
              min={key === 'font_scale' ? 0.7 : 0.25}
              max={key === 'font_scale' ? 1.6 : 14}
              step={key === 'font_scale' ? 0.05 : 0.05}
              value={L[key]}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (!Number.isFinite(n)) return
                onChange({
                  ...L,
                  preset: 'custom',
                  [key]: n,
                })
              }}
              className="h-8 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ManuscriptPages({ html, layout, className }) {
  const L = normalizePageLayout(layout)
  const scale = 0.55
  const px = 96 * scale
  const style = {
    width: `${L.width_in * px}px`,
    minHeight: `${L.height_in * px}px`,
    padding: `${L.margin_in * px}px`,
    fontSize: `${(L.font_scale || 1) * 14 * scale / 0.55}px`,
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <article
        className="bg-[var(--paper,#faf8f5)] text-[var(--ink,#1a1a1a)] shadow-md border border-black/10 font-document leading-relaxed max-w-full overflow-auto"
        style={style}
        dangerouslySetInnerHTML={{ __html: html || '<p></p>' }}
      />
    </div>
  )
}

export { createChapter, reorderChapters }
