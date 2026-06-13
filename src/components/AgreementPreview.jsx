import { buildAgreementText, buildAgreementSummary, getAgreementTypeLabel } from '@/utils/agreementUtils'
import { LEGAL_DISCLAIMER_TEXT } from '@/components/LegalDisclaimer'
import SignaturePad from './SignaturePad'

function renderLine(line, index) {
  if (line === '---') {
    return <hr key={index} className="my-4 border-border" />
  }

  const isHeading =
    line === line.toUpperCase() && line.length > 3 && /^[A-Z\s&]+$/.test(line)

  if (isHeading) {
    return (
      <h3 key={index} className="font-document text-lg font-bold mt-6 mb-2 text-foreground">
        {line}
      </h3>
    )
  }

  if (!line.trim()) {
    return <div key={index} className="h-2" />
  }

  return (
    <p key={index} className="font-document text-sm leading-relaxed text-foreground/90">
      {line}
    </p>
  )
}

function PreviewWatermark() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
      aria-hidden
    >
      <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-16 opacity-[0.08] rotate-[-24deg] scale-110">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="font-document text-sm font-bold uppercase tracking-widest text-foreground whitespace-nowrap"
          >
            Draft — Not For Execution
          </span>
        ))}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2 py-2 border-b border-border/50 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:w-36 shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

function AgreementSummaryPreview({ agreement }) {
  const summary = buildAgreementSummary(agreement)

  return (
    <div
      className="relative select-none"
      onCopy={(e) => e.preventDefault()}
    >
      <PreviewWatermark />

      <div className="relative z-0 space-y-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>Summary preview.</strong> Full legal text is hidden until you pay $5 to download or share.
          {' '}{LEGAL_DISCLAIMER_TEXT.short}
        </div>

        <dl>
          <SummaryRow label="Type" value={summary.type} />

          {summary.parties.map((p) => (
            <SummaryRow
              key={p.label}
              label={p.label}
              value={
                [p.name || '—', p.role && `(${p.role})`, p.percentage && `${p.percentage}%`]
                  .filter(Boolean)
                  .join(' ') || '—'
              }
            />
          ))}

          <SummaryRow label="Financial" value={summary.financialSummary} />
          <SummaryRow
            label="Duration"
            value={`${summary.duration.start} → ${summary.duration.end}`}
          />
          <SummaryRow label="Auto-renewal" value={summary.duration.autoRenewal} />
          <SummaryRow label="Termination" value={`${summary.duration.terminationNotice} notice`} />
          <SummaryRow label="Disputes" value={summary.dispute.method} />
          <SummaryRow label="Governing law" value={summary.dispute.governingLaw} />

          {summary.customClauseCount > 0 && (
            <SummaryRow
              label="Custom clauses"
              value={
                summary.customClauses.length
                  ? `${summary.customClauses.length} added: ${summary.customClauses.join(', ')}`
                  : `${summary.customClauseCount} added (titles not set)`
              }
            />
          )}
        </dl>

        <p className="text-xs text-muted-foreground italic pt-2">
          Boilerplate legal language, confidentiality provisions, and full clause text are not shown in this preview.
        </p>
      </div>
    </div>
  )
}

export default function AgreementPreview({
  agreement,
  signatures = {},
  onSignaturesChange,
  readOnly = false,
  unlocked = true,
  signaturesUnlocked = true,
}) {
  const text = buildAgreementText(agreement)
  const lines = text.split('\n')

  const partyLabels = [
    { key: 'partyA', label: agreement.parties?.partyA?.name || 'Party A' },
    { key: 'partyB', label: agreement.parties?.partyB?.name || 'Party B' },
  ]

  agreement.parties?.additional?.forEach((p, i) => {
    partyLabels.push({ key: `partner${i}`, label: p.name || `Partner ${i + 1}` })
  })

  const handleSignature = (key, dataUrl) => {
    onSignaturesChange?.({ ...signatures, [key]: dataUrl })
  }

  const showFullDocument = unlocked || readOnly

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-muted/30 px-6 py-3">
        <h2 className="font-semibold text-sm text-muted-foreground">
          {showFullDocument ? 'Live Document Preview' : 'Agreement Summary'}
        </h2>
        <p className="font-document text-xl font-bold mt-1">{getAgreementTypeLabel(agreement.type)}</p>
      </div>

      <div className="p-6 max-h-[60vh] overflow-y-auto relative">
        {showFullDocument ? (
          <>
            {!readOnly && (
              <div className="mb-4 rounded-md border border-primary/20 bg-accent/50 px-3 py-2 text-sm text-accent-foreground">
                Full document unlocked. You can download or share this agreement.
              </div>
            )}
            {lines.map((line, i) => renderLine(line, i))}
          </>
        ) : (
          <AgreementSummaryPreview agreement={agreement} />
        )}
      </div>

      {!readOnly && onSignaturesChange && signaturesUnlocked && showFullDocument && (
        <div className="border-t p-6 space-y-4">
          <h3 className="font-document text-lg font-bold">Signatures</h3>
          {partyLabels.map(({ key, label }) => (
            <SignaturePad
              key={key}
              label={label}
              value={signatures[key]}
              onChange={(dataUrl) => handleSignature(key, dataUrl)}
            />
          ))}
        </div>
      )}

      {!readOnly && onSignaturesChange && !signaturesUnlocked && (
        <div className="border-t px-6 py-4 text-sm text-muted-foreground text-center bg-muted/20">
          Pay $5 to download to unlock signatures and the full PDF.
        </div>
      )}

      {readOnly && Object.keys(signatures).length > 0 && (
        <div className="border-t p-6 space-y-4">
          <h3 className="font-document text-lg font-bold">Signatures</h3>
          {Object.entries(signatures).map(([key, dataUrl]) => (
            dataUrl && (
              <div key={key}>
                <p className="text-sm font-medium mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <img src={dataUrl} alt={`${key} signature`} className="border rounded h-16" />
              </div>
            )
          ))}
        </div>
      )}

      <div className="border-t bg-muted/20 px-6 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Template notice:</strong> {LEGAL_DISCLAIMER_TEXT.full}
        </p>
      </div>
    </div>
  )
}
