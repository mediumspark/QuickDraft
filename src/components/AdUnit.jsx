import * as React from 'react'
import {
  getAdSenseClient,
  loadAdSenseScript,
  pushAdSenseSlot,
} from '@/utils/ads'

export default function AdUnit({
  slot,
  format = 'auto',
  layout = '',
  className = '',
  label = 'Advertisement',
}) {
  const client = getAdSenseClient()
  const filled = React.useRef(false)

  React.useEffect(() => {
    if (!client || !slot || filled.current) return
    loadAdSenseScript(client)
    pushAdSenseSlot()
    filled.current = true
  }, [client, slot])

  if (!client || !slot) return null

  return (
    <aside className={`mx-auto w-full max-w-4xl ${className}`} aria-label={label}>
      <p className="mb-2 text-center text-[11px] uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
      <ins
        className="adsbygoogle block min-h-[90px] w-full overflow-hidden rounded-md border border-border/60 bg-muted/20"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout || undefined}
        data-full-width-responsive="true"
      />
    </aside>
  )
}
