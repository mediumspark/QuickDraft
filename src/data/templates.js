import { createEmptyDraft } from '@/utils/storageUtils'

function makeTemplate(id, name, type, description, overrides) {
  const base = createEmptyDraft()
  base.type = type
  return {
    id,
    name,
    type,
    description,
    data: { ...base, ...overrides, type },
  }
}

export const templates = [
  makeTemplate('rev-50-50', '50/50 Revenue Split', 'revenue_sharing', 'Equal revenue sharing between two founders.', {
    parties: {
      partyA: { name: 'Founder A', role: 'Co-Founder', address: '' },
      partyB: { name: 'Founder B', role: 'Co-Founder', address: '' },
      additional: [],
    },
    financial: {
      grossOrNet: 'gross',
      partyAPercent: 50,
      partyBPercent: 50,
      paymentFrequency: 'monthly',
      minimumThreshold: '1000',
      commissionRate: 10,
      commissionBasis: '',
    },
  }),
  makeTemplate('rev-net-quarterly', 'Net Revenue — Quarterly', 'revenue_sharing', 'Net revenue distributed quarterly with a $5K threshold.', {
    financial: {
      grossOrNet: 'net',
      partyAPercent: 60,
      partyBPercent: 40,
      paymentFrequency: 'quarterly',
      minimumThreshold: '5000',
    },
  }),
  makeTemplate('rev-saas', 'SaaS Partnership', 'revenue_sharing', 'Revenue share for SaaS product partnerships.', {
    parties: {
      partyA: { name: 'Product Owner', role: 'Licensor', address: '' },
      partyB: { name: 'Distribution Partner', role: 'Distributor', address: '' },
      additional: [],
    },
    financial: {
      grossOrNet: 'gross',
      partyAPercent: 70,
      partyBPercent: 30,
      paymentFrequency: 'monthly',
      minimumThreshold: '500',
    },
    customClauses: [
      { id: '1', title: 'Intellectual Property', body: 'All pre-existing IP remains with the originating Party. Joint IP created under this Agreement shall be owned proportionally to revenue share percentages.' },
    ],
  }),
  makeTemplate('profit-60-40', '60/40 Profit Share', 'profit_sharing', 'Standard profit sharing with 60/40 split after expenses.', {
    financial: {
      grossOrNet: 'net',
      partyAPercent: 60,
      partyBPercent: 40,
      paymentFrequency: 'quarterly',
      minimumThreshold: '10000',
    },
  }),
  makeTemplate('profit-jv', 'Joint Venture Profits', 'profit_sharing', 'Multi-party profit sharing for joint ventures.', {
    parties: {
      partyA: { name: 'Lead Partner', role: 'Managing Partner', address: '' },
      partyB: { name: 'Capital Partner', role: 'Investor', address: '' },
      additional: [{ name: 'Operations Partner', role: 'Operator', address: '', percentage: '20' }],
    },
    financial: {
      grossOrNet: 'net',
      partyAPercent: 40,
      partyBPercent: 40,
      paymentFrequency: 'quarterly',
      minimumThreshold: '25000',
    },
  }),
  makeTemplate('comm-sales', 'Sales Commission — 15%', 'commission_based', 'Standard 15% commission on net product sales.', {
    parties: {
      partyA: { name: 'Sales Agent', role: 'Agent', address: '' },
      partyB: { name: 'Company', role: 'Principal', address: '' },
      additional: [],
    },
    financial: {
      commissionRate: 15,
      commissionBasis: 'All net sales of products sold directly by Agent to end customers.',
    },
  }),
  makeTemplate('comm-referral', 'Referral Commission — 10%', 'commission_based', 'Commission on qualified referral leads.', {
    financial: {
      commissionRate: 10,
      commissionBasis: 'Qualified leads that result in a signed contract within 90 days of referral.',
    },
  }),
  makeTemplate('nda-mutual', 'Mutual NDA', 'nda', 'Standard mutual non-disclosure for business discussions.', {
    parties: {
      partyA: { name: 'Disclosing Party A', role: 'Company', address: '' },
      partyB: { name: 'Disclosing Party B', role: 'Company', address: '' },
      additional: [],
    },
    duration: {
      startDate: '',
      endDate: '',
      autoRenewal: false,
      renewalPeriod: '12 months',
      terminationNoticeDays: 30,
      terminationConditions: 'Either party may terminate upon 30 days written notice.',
    },
    customClauses: [
      { id: '1', title: 'Return of Materials', body: 'Upon termination, each Party shall return or destroy all Confidential Information received from the other Party.' },
    ],
  }),
]
