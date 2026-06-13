import { buildAgreementText, getAgreementTypeLabel } from '@/utils/agreementUtils'
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

export default function AgreementPreview({ agreement, signatures = {}, onSignaturesChange, readOnly = false }) {
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

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-muted/30 px-6 py-3">
        <h2 className="font-semibold text-sm text-muted-foreground">Live Document Preview</h2>
        <p className="font-document text-xl font-bold mt-1">{getAgreementTypeLabel(agreement.type)}</p>
      </div>

      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {lines.map((line, i) => renderLine(line, i))}
      </div>

      {!readOnly && onSignaturesChange && (
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
          <strong>Disclaimer:</strong> This document is generated for informational purposes only and does not
          constitute legal advice. Consult a qualified attorney before signing any agreement.
        </p>
      </div>
    </div>
  )
}
