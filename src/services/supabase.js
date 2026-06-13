import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function hasValidSupabaseEnv() {
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon') &&
    supabaseUrl.startsWith('https://')
  )
}

export const supabase = hasValidSupabaseEnv()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function isSupabaseConfigured() {
  return !!supabase
}

export async function getCurrentUser() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getAccessToken() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function saveDraftToBackend(draft, userId = null) {
  if (!supabase) {
    return { data: { id: draft.id || crypto.randomUUID() }, error: null, offline: true }
  }

  const uid = userId ?? (await getCurrentUser())?.id ?? null

  const payload = {
    session_id: draft.sessionId,
    agreement_type: draft.type,
    data: draft,
    share_token: draft.shareToken,
    is_shared: draft.isShared || false,
    updated_at: new Date().toISOString(),
  }

  if (uid) {
    payload.user_id = uid
  }

  if (draft.id) {
    const { data, error } = await supabase
      .from('agreements')
      .update(payload)
      .eq('id', draft.id)
      .select()
      .single()
    return { data, error }
  }

  const { data, error } = await supabase
    .from('agreements')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function loadAgreementById(id, shareToken) {
  if (!supabase) {
    const local = localStorage.getItem(`dealdraft_shared_${id}`)
    if (local) return { data: JSON.parse(local), error: null }
    return { data: null, error: new Error('Agreement not found') }
  }

  let query = supabase.from('agreements').select('*').eq('id', id)
  if (shareToken) {
    query = query.eq('share_token', shareToken)
  }
  const { data, error } = await query.single()
  if (error) return { data: null, error }
  return { data: data?.data || data, error: null }
}

export async function loadUserDraftById(id) {
  if (!supabase) return { data: null, error: new Error('Not configured') }

  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error }

  const draft = data.data
  return {
    data: { ...draft, id: data.id, sessionId: data.session_id },
    error: null,
  }
}

export async function listUserAgreements() {
  if (!supabase) return { data: [], error: null }

  const { data, error } = await supabase
    .from('agreements')
    .select('id, agreement_type, data, updated_at, created_at')
    .order('updated_at', { ascending: false })

  return { data: data || [], error }
}

export async function listUserPayments() {
  if (!supabase) return { data: [], error: null }

  const { data, error } = await supabase
    .from('document_payments')
    .select('id, document_id, action, amount_cents, created_at')
    .order('created_at', { ascending: false })

  return { data: data || [], error }
}

export async function claimSessionDrafts(sessionId, userId) {
  if (!supabase || !sessionId || !userId) return

  await supabase
    .from('agreements')
    .update({ user_id: userId })
    .eq('session_id', sessionId)
    .is('user_id', null)
}

export async function enableSharing(draft) {
  const shareToken = crypto.randomUUID()
  const updated = { ...draft, shareToken, isShared: true }
  const result = await saveDraftToBackend(updated)
  if (result.offline) {
    localStorage.setItem(`dealdraft_shared_${updated.id || shareToken}`, JSON.stringify(updated))
    return { ...updated, id: updated.id || shareToken }
  }
  if (result.data) {
    return { ...updated, id: result.data.id }
  }
  return updated
}
