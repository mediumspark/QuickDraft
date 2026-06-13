import { supabase } from '@/services/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

function getFunctionsUrl() {
  return `${supabaseUrl}/functions/v1`
}

async function getAuthHeaders() {
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

export async function getCreditBalance() {
  if (!supabase) return 0

  const { data, error } = await supabase.rpc('get_credit_balance')
  if (error) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .single()
    return profile?.credits ?? 0
  }
  return data ?? 0
}

export async function checkUnlockStatus(agreementId, action) {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('has_unlocked', {
    p_agreement_id: agreementId,
    p_action: action,
  })
  if (error) return false
  return !!data
}

export async function consumeCredit(agreementId, action) {
  if (!supabase) {
    return { unlocked: true, offline: true }
  }

  const headers = await getAuthHeaders()
  const response = await fetch(`${getFunctionsUrl()}/consume-credit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ agreementId, action }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to consume credit')
  }

  return response.json()
}

export async function createCheckoutSession(credits = 1) {
  if (!supabase) throw new Error('Supabase not configured')

  const headers = await getAuthHeaders()
  const response = await fetch(`${getFunctionsUrl()}/create-checkout-session`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ credits }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to create checkout session')
  }

  const { url } = await response.json()
  return url
}

export async function checkOrConsumeCredit(agreementId, action) {
  if (!supabase) {
    return { unlocked: true, offline: true }
  }

  if (!agreementId) {
    return { unlocked: false, needsSave: true }
  }

  const alreadyUnlocked = await checkUnlockStatus(agreementId, action)
  if (alreadyUnlocked) {
    return { unlocked: true, alreadyUnlocked: true }
  }

  return consumeCredit(agreementId, action)
}

export function isPaymentsConfigured() {
  return !!supabase && supabaseUrl && !supabaseUrl.includes('your-project')
}
