import { supabase } from '@/services/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const PAID_DOCUMENTS_KEY = 'dealdraft_paid_documents'
const PENDING_PAYMENT_KEY = 'dealdraft_pending_payment'

function getFunctionsUrl() {
  return `${supabaseUrl}/functions/v1`
}

async function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
      return headers
    }
  }

  headers.Authorization = `Bearer ${supabaseAnonKey}`
  return headers
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

export const PAID_ACTIONS = ['edit', 'download', 'share']

export function isDocumentPaid(documentId, action) {
  if (!documentId) return false
  const paid = loadPaidDocuments()
  return !!paid[documentId]?.[action]
}

/** Any paid action on a document unlocks further editing. */
export function canEditDocument(documentId) {
  if (!documentId) return false
  return PAID_ACTIONS.some((action) => isDocumentPaid(documentId, action))
}

export function markDocumentPaid(documentId, action) {
  const paid = loadPaidDocuments()
  paid[documentId] = { ...paid[documentId], [action]: true }
  savePaidDocuments(paid)
}

export async function syncUserPaidDocuments() {
  if (!supabase) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data, error } = await supabase
    .from('document_payments')
    .select('document_id, action')
    .eq('user_id', user.id)

  if (error || !data?.length) return

  const paid = loadPaidDocuments()
  for (const row of data) {
    paid[row.document_id] = { ...paid[row.document_id], [row.action]: true }
  }
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

export async function createDocumentCheckout(documentId, action, options = {}) {
  if (!isPaymentsConfigured()) {
    throw new Error('Payments not configured')
  }

  const { successPath, cancelPath, productLabel, ...extra } = options
  // Merge so callers can keep returnType / productId / withSignatures across checkout.
  const previous = getPendingPayment() || {}
  setPendingPayment(documentId, action, {
    ...previous,
    ...extra,
    successPath,
    cancelPath,
    productLabel,
  })

  const response = await fetch(`${getFunctionsUrl()}/create-document-checkout`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ documentId, action, successPath, cancelPath, productLabel }),
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
    headers: await getAuthHeaders(),
    body: JSON.stringify({ sessionId }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Payment verification failed')
  }

  return response.json()
}

export async function ensureDocumentAccess(documentId, action, options = {}) {
  if (!isPaymentsConfigured()) {
    return { unlocked: true, offline: true }
  }

  if (isDocumentPaid(documentId, action)) {
    return { unlocked: true, alreadyPaid: true }
  }

  const url = await createDocumentCheckout(documentId, action, options)
  return { unlocked: false, checkoutUrl: url }
}
