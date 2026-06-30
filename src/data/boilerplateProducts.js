import { templates } from '@/data/templates'

export const BOILERPLATE_LIST_PRICE_CENTS = 15000 // $150
export const BOILERPLATE_SALE_PRICE_CENTS = 500 // $5 launch sale
/** End of launch sale — 3 weeks from site launch (June 30, 2026) */
export const BOILERPLATE_SALE_END = '2026-07-21T23:59:59'

/** @deprecated use getBoilerplatePriceCents() */
export const BOILERPLATE_PRICE_CENTS = BOILERPLATE_SALE_PRICE_CENTS

export function isBoilerplateOnSale() {
  return new Date() <= new Date(BOILERPLATE_SALE_END)
}

export function getBoilerplatePriceCents() {
  return isBoilerplateOnSale() ? BOILERPLATE_SALE_PRICE_CENTS : BOILERPLATE_LIST_PRICE_CENTS
}

export function formatBoilerplatePrice(cents) {
  const dollars = cents / 100
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`
}

export function getBoilerplateSaleEndLabel() {
  return new Date(BOILERPLATE_SALE_END).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export const boilerplateProducts = [
  {
    id: 'simple-template',
    templateId: 'rev-50-50',
    name: 'Simple Template',
    description: 'Our most popular starter agreement — a clean 50/50 revenue split you can edit in Word and send today.',
    highlights: [
      'Ready-made Word document (.docx) — no builder required',
      '50/50 revenue split with monthly payments',
      'Parties, terms, and dispute clauses included',
    ],
    featured: true,
  },
  {
    id: 'revenue-sharing',
    templateId: 'rev-50-50',
    name: 'Revenue Sharing Agreement',
    description: 'Ready-to-edit 50/50 revenue split agreement for founders and collaborators.',
    highlights: [
      'Gross revenue basis with monthly distributions',
      'Party A / Party B placeholders',
      'Term, termination, and dispute resolution clauses',
    ],
  },
  {
    id: 'profit-sharing',
    templateId: 'profit-60-40',
    name: 'Profit Sharing Agreement',
    description: '60/40 net profit sharing boilerplate for startups and joint ventures.',
    highlights: [
      'Net profit calculation basis',
      'Quarterly payment schedule',
      'Minimum threshold provision',
    ],
  },
  {
    id: 'commission',
    templateId: 'comm-sales',
    name: 'Commission Agreement',
    description: 'Sales commission agreement with rate and qualifying transaction language.',
    highlights: [
      '15% commission rate boilerplate',
      'Agent / principal party structure',
      'Commission basis definition',
    ],
  },
  {
    id: 'nda',
    templateId: 'nda-mutual',
    name: 'Mutual NDA',
    description: 'Mutual non-disclosure agreement for business discussions and collaborations.',
    highlights: [
      'Confidentiality obligations for both parties',
      'Return of materials clause',
      'Three-year survival period',
    ],
  },
  {
    id: 'privacy-policy',
    templateId: 'privacy-website',
    name: 'Privacy Policy',
    description: 'Website or SaaS privacy policy with cookies and third-party services sections.',
    highlights: [
      'Data collection and usage sections',
      'User rights and children\'s privacy',
      'Cookies and third-party provider clauses',
    ],
  },
  {
    id: 'eula',
    templateId: 'eula-software',
    name: 'Software EULA',
    description: 'End User License Agreement for downloadable software products.',
    highlights: [
      'License grant and usage restrictions',
      'Warranty disclaimer and liability cap',
      'Export compliance clause',
    ],
  },
]

export function getBoilerplateProduct(id) {
  return boilerplateProducts.find((p) => p.id === id)
}

export function getFeaturedBoilerplate() {
  return boilerplateProducts.find((p) => p.featured) ?? boilerplateProducts[0]
}

export function getBoilerplateAgreementData(product) {
  const template = templates.find((t) => t.id === product.templateId)
  return template?.data ?? null
}

export function getBoilerplateDocumentId(productId) {
  return `boilerplate:${productId}`
}

export function getBoilerplateFilename(product) {
  const slug = product.id.replace(/-/g, '_')
  return `${slug}_boilerplate.docx`
}
