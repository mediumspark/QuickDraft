/**
 * Canonical app URL for SEO, sitemaps, and dashboard setup.
 * Set VITE_SITE_URL in production builds (e.g. https://www.aquickdraft.com).
 */
export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured && !configured.includes('your-site') && !configured.includes('localhost')) {
    return configured.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return 'https://www.aquickdraft.com'
}

/**
 * OAuth return URL. Always use the host the user is currently on so production
 * sign-in never sends people to localhost (and local dev stays on localhost).
 */
export function getAuthRedirectUrl(path = '/') {
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin.replace(/\/$/, '')
      : getSiteUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
