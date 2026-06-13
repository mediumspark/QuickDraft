const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const PAID_DOCUMENTS_KEY = 'dealdraft_paid_documents'
const PENDING_PAYMENT_KEY = 'dealdraft_pending_payment'

function getFunctionsUrl() {
  return `${supabaseUrl}/functions/v1`
}

function getPublicHeaders() {
  return {
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  }
}

export function isPaymentsConfigured() {
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon')
  )
}

function loadPaidDocuments() {
  try {
    return JSON.parse(localStorage.getItem(PAID_DOCUMENTS_KEY) || '{}')
  } catch {
    return {}
  }
}

function savePaidDocuments(data) {
  localStorage.setItem(PAID_DOCUMENTS_KEY, JSON.stringify(data))
}

export function isDocumentPaid(documentId, action) {
  if (!documentId) return false
  const paid = loadPaidDocuments()
  return !!paid[documentId]?.[action]
}

export function markDocumentPaid(documentId, action) {
  const paid = loadPaidDocuments()
  paid[documentId] = { ...paid[documentId], [action]: true }
  savePaidDocuments(paid)
}

export function setPendingPayment(documentId, action, extra = {}) {
  sessionStorage.setItem(
    PENDING_PAYMENT_KEY,
    JSON.stringify({ documentId, action, ...extra })
  )
}

export function getPendingPayment() {
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearPendingPayment() {
  sessionStorage.removeItem(PENDING_PAYMENT_KEY)
}

export async function createDocumentCheckout(documentId, action) {
  if (!isPaymentsConfigured()) {
    throw new Error('Payments not configured')
  }

  setPendingPayment(documentId, action)

  const response = await fetch(`${getFunctionsUrl()}/create-document-checkout`, {
    method: 'POST',
    headers: getPublicHeaders(),
    body: JSON.stringify({ documentId, action }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to start checkout')
  }

  const { url } = await response.json()
  return url
}

export async function verifyDocumentPayment(sessionId) {
  if (!isPaymentsConfigured()) {
    return { paid: true, offline: true }
  }

  const response = await fetch(`${getFunctionsUrl()}/verify-document-payment`, {
    method: 'POST',
    headers: getPublicHeaders(),
    body: JSON.stringify({ sessionId }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Payment verification failed')
  }

  return response.json()
}

export async function ensureDocumentAccess(documentId, action) {
  if (!isPaymentsConfigured()) {
    return { unlocked: true, offline: true }
  }

  if (isDocumentPaid(documentId, action)) {
    return { unlocked: true, alreadyPaid: true }
  }

  const url = await createDocumentCheckout(documentId, action)
  return { unlocked: false, checkoutUrl: url }
}
