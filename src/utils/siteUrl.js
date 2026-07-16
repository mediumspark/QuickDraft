/**
 * Canonical production URL for SEO, OAuth redirects, and absolute links.
 * Always resolves to the live site — never localhost.
 */
const PRODUCTION_URL = 'https://www.aquickdraft.com'

export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '')
  if (
    configured &&
    !configured.includes('your-site') &&
    !configured.includes('localhost') &&
    !configured.includes('127.0.0.1')
  ) {
    return configured
  }
  return PRODUCTION_URL
}

/** Google / Supabase OAuth must always return users to the live site. */
export function getAuthRedirectUrl(path = '/') {
  const base = getSiteUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
