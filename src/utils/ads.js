const ADSENSE_SCRIPT_ID = 'aquickdraft-adsense'

export function getGoogleAdsId() {
  return import.meta.env.VITE_GOOGLE_ADS_ID || 'AW-18321453231'
}

export function getAdSenseClient() {
  return import.meta.env.VITE_ADSENSE_CLIENT || ''
}

export function getLandingAdSlot() {
  return import.meta.env.VITE_ADSENSE_SLOT_LANDING || ''
}

export function getGoogleAdsConversionLabel() {
  return import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL || ''
}

export function loadAdSenseScript(clientId = getAdSenseClient()) {
  if (!clientId || typeof document === 'undefined') return
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = ADSENSE_SCRIPT_ID
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
  document.head.appendChild(script)
}

export function pushAdSenseSlot() {
  if (typeof window === 'undefined') return
  try {
    window.adsbygoogle = window.adsbygoogle || []
    window.adsbygoogle.push({})
  } catch {
    // Ad blockers or script load failures — ignore.
  }
}

/** Fire a Google Ads purchase conversion after Stripe checkout succeeds. */
export function trackPurchaseConversion({ value = 0.99, currency = 'USD', transactionId } = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return

  const sendTo = getGoogleAdsConversionLabel()
    ? `${getGoogleAdsId()}/${getGoogleAdsConversionLabel()}`
    : getGoogleAdsId()

  window.gtag('event', 'conversion', {
    send_to: sendTo,
    value,
    currency,
    transaction_id: transactionId,
  })
}
