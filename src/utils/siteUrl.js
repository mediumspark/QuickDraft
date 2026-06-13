/**
 * Canonical app URL for OAuth redirects and dashboard setup.
 * Set VITE_SITE_URL in .env for production (e.g. https://www.aquickdraft.com).
 * Falls back to the current browser origin when unset.
 */
export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured && !configured.includes('your-site')) {
    return configured.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

export function getAuthRedirectUrl(path = '/') {
  const base = getSiteUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
