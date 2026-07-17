import { getSiteUrl } from '@/utils/siteUrl'

export const siteName = 'AQuickDraft'

export const siteConfig = {
  name: siteName,
  url: getSiteUrl() || 'https://www.aquickdraft.com',
  defaultTitle: `${siteName} — Agreement Templates for Devs & Students`,
  titleTemplate: `%s | ${siteName}`,
  defaultDescription:
    'Agreement templates for game developers, technical folks, and college students. Draft and read free; pay $0.99 to edit, download, or share.',
  defaultOgImage: '/og-image.svg',
  twitterHandle: '',
  audience: ['game developers', 'technical folks', 'college students'],
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
