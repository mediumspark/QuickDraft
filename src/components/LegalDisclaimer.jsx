const DISCLAIMERS = {
  short:
    'Template only — not created by lawyers. Read carefully before sharing.',
  standard:
    'These agreements are templates only. They are not crafted or reviewed by lawyers. Read through your document carefully before presenting it to others.',
  full:
    'AQuickDraft provides agreement templates for informational purposes only. Documents are not crafted, reviewed, or created by lawyers and do not constitute legal advice. Always read through your agreement carefully before presenting it to others. Consult a qualified attorney for high-stakes or complex deals.',
}

export function LegalDisclaimer({ variant = 'standard', className = '' }) {
  const text = DISCLAIMERS[variant] || DISCLAIMERS.standard

  if (variant === 'banner') {
    return (
      <div className={`rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 ${className}`}>
        <strong>Template notice:</strong> {DISCLAIMERS.standard}
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <p className={`text-xs text-muted-foreground leading-relaxed ${className}`}>
        {DISCLAIMERS.full}
      </p>
    )
  }

  if (variant === 'compact') {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>
        {DISCLAIMERS.short}
      </p>
    )
  }

  return (
    <p className={`text-sm text-muted-foreground leading-relaxed ${className}`}>
      {text}
    </p>
  )
}

export const LEGAL_DISCLAIMER_TEXT = DISCLAIMERS
