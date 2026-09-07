import { getSiteUrl } from '@/utils/siteUrl'

export const siteName = 'AQuickDraft'

export const siteConfig = {
  name: siteName,
  url: getSiteUrl() || 'https://www.aquickdraft.com',
  defaultTitle: `${siteName} — Agreement Templates for Your Startup`,
  titleTemplate: `%s | ${siteName}`,
  defaultDescription:
    'Draft revenue splits, co-founder deals, and NDAs for your startup. Read the full agreement free; pay $0.99 to edit, download, or share.',
  defaultOgImage: '/og-image.svg',
  twitterHandle: '',
  audience: ['startups', 'side projects', 'student ventures'],
}

export function formatTitle(title) {
  if (!title || title === siteConfig.defaultTitle) return siteConfig.defaultTitle
  return siteConfig.titleTemplate.replace('%s', title)
}

export function absoluteUrl(path = '/') {
  const base = siteConfig.url.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
