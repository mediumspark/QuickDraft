import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export function isSupabaseConfigured() {
  return !!supabase
}

async function getCurrentUserId() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function saveDraftToBackend(draft) {
  if (!supabase) {
    return { data: { id: draft.id || crypto.randomUUID() }, error: null, offline: true }
  }

  const userId = await getCurrentUserId()

  const payload = {
    session_id: draft.sessionId,
    agreement_type: draft.type,
    data: draft,
    share_token: draft.shareToken,
    is_shared: draft.isShared || false,
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
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
