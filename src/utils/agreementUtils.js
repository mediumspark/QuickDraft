export function getOrCreateSessionId() {
  const key = 'dealdraft_session_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function getAgreementTypeLabel(type) {
  const labels = {
    revenue_sharing: 'Revenue Sharing Agreement',
    profit_sharing: 'Profit Sharing Agreement',
    commission_based: 'Commission-Based Agreement',
    nda: 'Non-Disclosure Agreement (NDA)',
  }
  return labels[type] || 'Agreement'
}

function formatParty(party, label) {
  const lines = []
  if (party.name) lines.push(`${label}: ${party.name}`)
  if (party.role) lines.push(`Role: ${party.role}`)
  if (party.address) lines.push(`Address: ${party.address}`)
  return lines
}

function buildPartiesSection(agreement) {
  const lines = ['PARTIES', '']
  const { partyA, partyB, additional } = agreement.parties || {}

  lines.push(...formatParty(partyA, 'Party A'))
  lines.push('')
  lines.push(...formatParty(partyB, 'Party B'))

  if (additional?.length) {
    additional.forEach((p, i) => {
      lines.push('')
      lines.push(...formatParty(p, `Additional Partner ${i + 1}`))
      if (p.percentage) lines.push(`Ownership Percentage: ${p.percentage}%`)
    })
  }

  lines.push('')
  lines.push(
    'The parties listed above (collectively, the "Parties" and individually, a "Party") enter into this Agreement as of the Effective Date set forth below.'
  )
  return lines
}

function buildFinancialSection(agreement) {
  const lines = ['FINANCIAL TERMS', '']
  const f = agreement.financial || {}
  const type = agreement.type

  if (type === 'commission_based') {
    lines.push(`Commission Rate: ${f.commissionRate || 0}%`)
    if (f.commissionBasis) {
      lines.push(`Commission Basis: ${f.commissionBasis}`)
    }
    lines.push('')
    lines.push(
      'Party B shall pay Party A the commission specified above on all qualifying transactions as defined by the commission basis.'
    )
    return lines
  }

  if (type === 'nda') {
    lines.push('This Agreement does not include financial compensation terms.')
    lines.push('')
    lines.push(
      'No monetary consideration is exchanged under this Agreement unless otherwise specified in a separate written instrument signed by both Parties.'
    )
    return lines
  }

  const basis = f.grossOrNet === 'net' ? 'Net' : 'Gross'
  const typeLabel = type === 'profit_sharing' ? 'profits' : 'revenue'
  lines.push(`${basis} ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Basis`)

  const { partyA, partyB, additional } = agreement.parties || {}
  lines.push(`Party A (${partyA?.name || 'Party A'}): ${f.partyAPercent || 0}%`)
  lines.push(`Party B (${partyB?.name || 'Party B'}): ${f.partyBPercent || 0}%`)

  additional?.forEach((p, i) => {
    if (p.percentage) {
      lines.push(`Additional Partner ${i + 1} (${p.name || 'Partner'}): ${p.percentage}%`)
    }
  })

  lines.push('')
  lines.push(`Payment Frequency: ${formatFrequency(f.paymentFrequency)}`)

  if (f.minimumThreshold) {
    lines.push(`Minimum Threshold: $${f.minimumThreshold}`)
    lines.push(
      'No distribution shall be made until cumulative amounts exceed the minimum threshold specified above.'
    )
  }

  lines.push('')
  lines.push(
    `All ${typeLabel} shall be calculated on a ${basis.toLowerCase()} basis and distributed according to the percentages specified above within thirty (30) days following each payment period.`
  )
  return lines
}

function formatFrequency(freq) {
  const map = {
    weekly: 'Weekly',
    biweekly: 'Bi-Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annually: 'Annually',
  }
  return map[freq] || freq || 'Monthly'
}

function buildDurationSection(agreement) {
  const lines = ['TERM AND TERMINATION', '']
  const d = agreement.duration || {}

  if (d.startDate) lines.push(`Effective Date: ${d.startDate}`)
  if (d.endDate) lines.push(`End Date: ${d.endDate}`)

  if (d.autoRenewal) {
    lines.push('')
    lines.push(`Auto-Renewal: This Agreement shall automatically renew for successive periods of ${d.renewalPeriod || '12 months'} unless terminated in accordance with this section.`)
  }

  lines.push('')
  lines.push(`Termination Notice: Either Party may terminate this Agreement upon ${d.terminationNoticeDays || 30} days' written notice to the other Party.`)

  if (d.terminationConditions) {
    lines.push('')
    lines.push('Additional Termination Conditions:')
    lines.push(d.terminationConditions)
  }

  return lines
}

function buildDisputeSection(agreement) {
  const lines = ['DISPUTE RESOLUTION', '']
  const d = agreement.dispute || {}

  const methodLabels = {
    arbitration: 'Binding Arbitration',
    litigation: 'Litigation in Courts of Competent Jurisdiction',
    mediation_arbitration: 'Mediation followed by Binding Arbitration',
  }
  lines.push(`Resolution Method: ${methodLabels[d.method] || d.method}`)

  if (d.mediationStep || d.method === 'mediation_arbitration') {
    lines.push('')
    lines.push(
      'The Parties agree to first attempt to resolve any dispute through good-faith mediation before proceeding to arbitration or litigation.'
    )
  }

  if (d.arbitrationRules && d.method !== 'litigation') {
    lines.push(`Arbitration Rules: ${d.arbitrationRules}`)
  }

  lines.push('')
  const state = d.governingState || '[State]'
  const country = d.governingCountry || 'United States'
  lines.push(`Governing Law: This Agreement shall be governed by the laws of ${state}, ${country}, without regard to conflict of law principles.`)

  return lines
}

function buildCustomClausesSection(agreement) {
  const clauses = agreement.customClauses || []
  if (!clauses.length) return []

  const lines = ['ADDITIONAL PROVISIONS', '']
  clauses.forEach((clause, i) => {
    if (clause.title) {
      lines.push(`${i + 1}. ${clause.title.toUpperCase()}`)
      lines.push('')
    }
    if (clause.body) {
      lines.push(clause.body)
      lines.push('')
    }
  })
  return lines
}

function buildNdaSection() {
  return [
    'CONFIDENTIALITY OBLIGATIONS',
    '',
    'Each Party agrees to hold in strict confidence all Confidential Information disclosed by the other Party.',
    '',
    'Confidential Information includes, but is not limited to, business plans, financial data, customer lists, trade secrets, technical data, and any information marked or identified as confidential.',
    '',
    'The receiving Party shall not disclose Confidential Information to any third party without the prior written consent of the disclosing Party, except as required by law.',
    '',
    'These obligations shall survive termination of this Agreement for a period of three (3) years.',
  ]
}

export function buildAgreementText(agreement) {
  if (!agreement) return ''

  const lines = []
  const title = getAgreementTypeLabel(agreement.type)

  lines.push(title.toUpperCase())
  lines.push('')
  lines.push(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push(...buildPartiesSection(agreement))
  lines.push('')
  lines.push('---')
  lines.push('')

  if (agreement.type === 'nda') {
    lines.push(...buildNdaSection(agreement))
  } else {
    lines.push(...buildFinancialSection(agreement))
  }

  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(...buildDurationSection(agreement))
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(...buildDisputeSection(agreement))

  const customLines = buildCustomClausesSection(agreement)
  if (customLines.length) {
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push(...customLines)
  }

  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('GENERAL PROVISIONS')
  lines.push('')
  lines.push('This Agreement constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, or agreements relating to this subject matter.')
  lines.push('')
  lines.push('This Agreement may only be amended in writing signed by all Parties.')
  lines.push('')
  lines.push('If any provision of this Agreement is found to be unenforceable, the remaining provisions shall continue in full force and effect.')
  lines.push('')
  lines.push('This Agreement may be executed in counterparts, each of which shall be deemed an original.')

  return lines.join('\n')
}

const DISPUTE_METHOD_LABELS = {
  arbitration: 'Binding Arbitration',
  litigation: 'Litigation',
  mediation_arbitration: 'Mediation then Arbitration',
}

export function buildAgreementSummary(agreement) {
  const f = agreement.financial || {}
  const d = agreement.duration || {}
  const dispute = agreement.dispute || {}
  const { partyA, partyB, additional } = agreement.parties || {}
  const type = agreement.type

  let financialSummary = 'Not specified'
  if (type === 'commission_based') {
    financialSummary = `${f.commissionRate || 0}% commission on ${f.commissionBasis || 'qualifying transactions'}`
  } else if (type === 'nda') {
    financialSummary = 'No financial terms (NDA)'
  } else {
    const basis = f.grossOrNet === 'net' ? 'Net' : 'Gross'
    const label = type === 'profit_sharing' ? 'profit' : 'revenue'
    financialSummary = `${basis} ${label}: Party A ${f.partyAPercent || 0}% / Party B ${f.partyBPercent || 0}%, ${formatFrequency(f.paymentFrequency)}`
    if (f.minimumThreshold) {
      financialSummary += `, $${f.minimumThreshold} minimum threshold`
    }
  }

  const parties = [
    { label: 'Party A', name: partyA?.name, role: partyA?.role },
    { label: 'Party B', name: partyB?.name, role: partyB?.role },
  ]

  additional?.forEach((p, i) => {
    parties.push({
      label: `Partner ${i + 1}`,
      name: p.name,
      role: p.role,
      percentage: p.percentage,
    })
  })

  const customClauses = (agreement.customClauses || [])
    .filter((c) => c.title?.trim())
    .map((c) => c.title.trim())

  return {
    type: getAgreementTypeLabel(type),
    parties,
    financialSummary,
    duration: {
      start: d.startDate || 'Not set',
      end: d.endDate || 'Not set',
      autoRenewal: d.autoRenewal ? `Yes (${d.renewalPeriod || '12 months'})` : 'No',
      terminationNotice: `${d.terminationNoticeDays || 30} days`,
    },
    dispute: {
      method: DISPUTE_METHOD_LABELS[dispute.method] || dispute.method || 'Not set',
      governingLaw: [dispute.governingState, dispute.governingCountry].filter(Boolean).join(', ') || 'Not set',
    },
    customClauses,
    customClauseCount: agreement.customClauses?.length || 0,
  }
}

export function buildEmailSummary(agreement) {
  const f = agreement.financial || {}
  const d = agreement.duration || {}
  const { partyA, partyB } = agreement.parties || {}

  let financialSummary = ''
  if (agreement.type === 'commission_based') {
    financialSummary = `Commission: ${f.commissionRate}% on ${f.commissionBasis || 'qualifying transactions'}`
  } else if (agreement.type !== 'nda') {
    financialSummary = `Split: Party A ${f.partyAPercent}% / Party B ${f.partyBPercent}%, ${formatFrequency(f.paymentFrequency)}`
  } else {
    financialSummary = 'NDA — no financial terms'
  }

  return [
    `Agreement Type: ${getAgreementTypeLabel(agreement.type)}`,
    `Party A: ${partyA?.name || 'Not specified'}`,
    `Party B: ${partyB?.name || 'Not specified'}`,
    `Financial Terms: ${financialSummary}`,
    `Duration: ${d.startDate || 'TBD'} to ${d.endDate || 'TBD'}`,
  ].join('\n')
}

export function extractEmailsFromDraft(draft) {
  const emails = new Set()
  const regex = /[\w.+-]+@[\w-]+\.[\w.-]+/gi
  const { partyA, partyB, additional } = draft.parties || {}

  ;[partyA, partyB, ...(additional || [])].forEach((party) => {
    if (party?.address) {
      const matches = party.address.match(regex)
      matches?.forEach((e) => emails.add(e.toLowerCase()))
    }
  })

  return [...emails]
}
