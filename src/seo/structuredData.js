import { siteConfig } from './siteConfig'

export const faqItems = [
  {
    question: 'Are AQuickDraft agreements created by lawyers?',
    answer:
      'No. AQuickDraft provides agreement templates only. Documents are not crafted, reviewed, or created by lawyers. Always read through your agreement carefully before presenting it to others.',
  },
  {
    question: 'Who is AQuickDraft for?',
    answer:
      'Game developers, technical collaborators, and college students who need fast, affordable agreement templates for revenue sharing, profit sharing, commissions, and NDAs.',
  },
  {
    question: 'How much does AQuickDraft cost?',
    answer:
      'Drafting and reading the full agreement are free. Pay $5 per document to edit a saved draft, download a PDF, or generate a shareable link. No subscriptions.',
  },
  {
    question: 'Do I still need a lawyer?',
    answer:
      'For important or high-stakes deals, yes. Templates are a starting point to clarify terms between partners — not a replacement for professional legal advice.',
  },
  {
    question: 'Can I preview an agreement before paying?',
    answer:
      'Yes. You can draft agreements and read the full legal text for free. Paying unlocks editing saved drafts, PDF download, or sharing.',
  },
  {
    question: 'What agreement types are supported?',
    answer:
      'Revenue sharing, profit sharing, commission-based agreements, and NDAs — plus custom clauses you can add yourself.',
  },
]

export const guideSteps = [
  { name: 'Choose your agreement type', text: 'Select from Revenue Sharing, Profit Sharing, Commission-Based, or NDA templates.' },
  { name: 'Define the parties', text: 'Enter names, roles, and addresses for Party A, Party B, and additional partners.' },
  { name: 'Set financial terms', text: 'Configure percentages, payment frequency, thresholds, or commission rates.' },
  { name: 'Add duration and dispute clauses', text: 'Set start/end dates, auto-renewal, termination notice, and governing law.' },
  { name: 'Customize with extra clauses', text: 'Add free-text provisions for non-compete, IP ownership, or special terms.' },
  { name: 'Preview carefully', text: 'Review the full live document preview. Read every clause before sharing.' },
  { name: 'Pay and download', text: 'Pay $5 to download your PDF, share a link, or unlock editing on a saved draft.' },
]

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.defaultDescription,
  }
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free drafting and full agreement reading. $5 to edit, download, or share.',
    },
    description: siteConfig.defaultDescription,
    url: siteConfig.url,
  }
}

export function howToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to draft an agreement with AQuickDraft',
    description: 'Create a partnership or revenue-sharing template in under 10 minutes.',
    step: guideSteps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  }
}

export function faqPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function pricingOfferSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: 'AQuickDraft per-document edit, download, or share',
    price: '5.00',
    priceCurrency: 'USD',
    description: '$5 per document to edit a saved draft, download a PDF, or generate a shareable link. Drafting and reading are free.',
    url: `${siteConfig.url}/pricing`,
    seller: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
  }
}

export function templatePageSchema({ name, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: `${siteConfig.url}${path}`,
    about: {
      '@type': 'Thing',
      name: `${name} template`,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }
}

export function homeSchemas() {
  return [organizationSchema(), softwareApplicationSchema()]
}
