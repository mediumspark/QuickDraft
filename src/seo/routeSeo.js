import { siteConfig } from './siteConfig'
import {
  homeSchemas,
  howToSchema,
  faqPageSchema,
  pricingOfferSchema,
  templatePageSchema,
} from './structuredData'

export const routeSeo = {
  '/': {
    title: 'Agreement Templates for Devs & Students',
    description:
      'Agreement templates for game developers, technical folks, and college students. Draft free, pay $5 to download. Templates only — not created by lawyers.',
    index: true,
    jsonLd: homeSchemas(),
  },
  '/about': {
    title: 'About',
    description:
      'AQuickDraft helps game developers, technical collaborators, and college students draft affordable agreement templates.',
    index: true,
  },
  '/guide': {
    title: 'How to Draft an Agreement',
    description:
      'Step-by-step guide to creating revenue sharing, profit sharing, commission, and NDA templates with AQuickDraft.',
    index: true,
    jsonLd: [howToSchema()],
  },
  '/contact': {
    title: 'Contact',
    description: 'Contact AQuickDraft with questions or feedback about agreement templates.',
    index: true,
  },
  '/faq': {
    title: 'FAQ',
    description:
      'Frequently asked questions about AQuickDraft templates, pricing, and legal disclaimers. Templates are not created by lawyers.',
    index: true,
    jsonLd: [faqPageSchema()],
  },
  '/pricing': {
    title: 'Pricing',
    description:
      '$5 per document to download or share. $5 for boilerplate Word agreements. Free drafting and summary previews. Built for student and indie dev budgets.',
    index: true,
    jsonLd: [pricingOfferSchema()],
  },
  '/boilerplates': {
    title: 'Boilerplate Word Agreements',
    description:
      'Purchase ready-made agreement templates as editable Word documents (.docx). Revenue sharing, NDAs, privacy policies, and more — $5 each.',
    index: true,
  },
  '/boilerplates/simple-template': {
    title: 'Simple Template — Word Agreement',
    description:
      'Buy the Simple Template: a ready-made 50/50 revenue sharing agreement as an editable Word document (.docx) for $5.',
    index: true,
  },
  '/templates/revenue-sharing': {
    title: 'Revenue Sharing Agreement Template',
    description:
      'Free revenue sharing agreement template for game developers and technical collaborators. Split game sales, DLC, or merch revenue. $5 to download.',
    index: true,
    jsonLd: [templatePageSchema({
      name: 'Revenue Sharing Agreement Template',
      description: 'Template for splitting revenue between partners on games, side projects, and collaborations.',
      path: '/templates/revenue-sharing',
    })],
  },
  '/templates/profit-sharing': {
    title: 'Profit Sharing Agreement Template',
    description:
      'Profit sharing agreement template for startups, side projects, and student ventures. Distribute profits after expenses. Templates only.',
    index: true,
    jsonLd: [templatePageSchema({
      name: 'Profit Sharing Agreement Template',
      description: 'Template for distributing profits among partners after expenses.',
      path: '/templates/profit-sharing',
    })],
  },
  '/templates/commission': {
    title: 'Commission Agreement Template',
    description:
      'Commission-based agreement template for sales referrals, contract work, and affiliate deals. Affordable template for technical folks.',
    index: true,
    jsonLd: [templatePageSchema({
      name: 'Commission Agreement Template',
      description: 'Template for percentage commissions on qualifying transactions.',
      path: '/templates/commission',
    })],
  },
  '/templates/nda': {
    title: 'NDA Template for Collaborators',
    description:
      'Non-disclosure agreement template for game dev teams, technical collaborators, and student projects. Protect confidential information.',
    index: true,
    jsonLd: [templatePageSchema({
      name: 'NDA Template for Collaborators',
      description: 'Template for protecting confidential information between parties.',
      path: '/templates/nda',
    })],
  },
  '/builder': {
    title: 'Agreement Builder',
    description: 'Draft and preview agreement templates.',
    index: false,
  },
  '/account': {
    title: 'Account',
    description: 'Your AQuickDraft account.',
    index: false,
  },
}

export const indexableRoutes = Object.entries(routeSeo)
  .filter(([, config]) => config.index)
  .map(([path]) => path)

export function getSeoForPath(pathname) {
  if (routeSeo[pathname]) return routeSeo[pathname]

  if (pathname.startsWith('/view/')) {
    return {
      title: 'Shared Agreement',
      description: 'View a shared agreement.',
      index: false,
    }
  }

  return {
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    index: false,
  }
}
