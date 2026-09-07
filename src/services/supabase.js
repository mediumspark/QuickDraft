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

const VIEWER_KEY = 'aqd_viewer_key'

export function getViewerKey() {
  let key = localStorage.getItem(VIEWER_KEY)
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem(VIEWER_KEY, key)
  }
  return key
}

export function countWords(text) {
  const trimmed = (text || '').trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

// ---- Drafts ----

export async function listDrafts() {
  if (!supabase) return { data: [], error: null, offline: true }
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .order('updated_at', { ascending: false })
  return { data: data || [], error }
}

export async function getDraft(id) {
  if (!supabase) return { data: null, error: null, offline: true }
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function saveDraft(draft) {
  if (!supabase) {
    return { data: { ...draft, id: draft.id || crypto.randomUUID() }, error: null, offline: true }
  }

  const user = await getCurrentUser()
  if (!user) return { data: null, error: new Error('Sign in required to save drafts') }

  const payload = {
    title: draft.title || 'Untitled',
    body: draft.body || '',
    prompt: draft.prompt || '',
    word_goal: draft.word_goal ?? null,
    timer_seconds: draft.timer_seconds ?? 1500,
    word_count: countWords(draft.body),
    ai_status: draft.ai_status || 'ai_free',
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }

  if (draft.id) {
    const { data, error } = await supabase
      .from('drafts')
      .update(payload)
      .eq('id', draft.id)
      .select()
      .single()
    return { data, error }
  }

  const { data, error } = await supabase
    .from('drafts')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function deleteDraft(id) {
  if (!supabase) return { error: null, offline: true }
  const { error } = await supabase.from('drafts').delete().eq('id', id)
  return { error }
}

// ---- Forum posts ----

export async function listForumPosts() {
  if (!supabase) return { data: [], error: null, offline: true }
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, profiles!user_id(display_name, email)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export async function getForumPost(id) {
  if (!supabase) return { data: null, error: null, offline: true }
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, profiles!user_id(display_name, email)')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function publishToForum({ title, body, draftId, aiStatus, feedbackVisibility }) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  if (aiStatus === 'ai_generated') {
    return { data: null, error: new Error('AI-generated writing can’t be shared to the forum.') }
  }

  const user = await getCurrentUser()
  if (!user) return { data: null, error: new Error('Sign in required') }

  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      user_id: user.id,
      draft_id: draftId || null,
      title: title || 'Untitled',
      body: body || '',
      status: 'published',
      ai_status: aiStatus,
      feedback_visibility: feedbackVisibility || 'accounts_only',
    })
    .select()
    .single()
  return { data, error }
}

export async function updateForumPost(id, patch) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  const { data, error } = await supabase
    .from('forum_posts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function recordPostView(postId) {
  if (!supabase) return { count: 0, offline: true }
  const { data, error } = await supabase.rpc('record_post_view', {
    p_post_id: postId,
    p_viewer_key: getViewerKey(),
  })
  return { count: data ?? 0, error }
}

// ---- Comments ----

export async function listComments(postId) {
  if (!supabase) return { data: [], error: null, offline: true }
  const { data, error } = await supabase
    .from('forum_comments')
    .select('*, profiles!user_id(display_name, email)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  return { data: data || [], error }
}

export async function createComment({ postId, body, anchorType, startOffset, endOffset, quoteText }) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  const user = await getCurrentUser()
  if (!user) return { data: null, error: new Error('Sign in required to comment') }

  const payload = {
    post_id: postId,
    user_id: user.id,
    body,
    anchor_type: anchorType,
  }

  if (anchorType === 'selection') {
    payload.start_offset = startOffset
    payload.end_offset = endOffset
    payload.quote_text = quoteText || ''
  }

  const { data, error } = await supabase
    .from('forum_comments')
    .insert(payload)
    .select('*, profiles!user_id(display_name, email)')
    .single()
  return { data, error }
}

export async function deleteComment(id) {
  if (!supabase) return { error: null, offline: true }
  const { error } = await supabase.from('forum_comments').delete().eq('id', id)
  return { error }
}

export function authorLabel(profile, fallback = 'Writer') {
  if (!profile) return fallback
  return profile.display_name || profile.email?.split('@')[0] || fallback
}

export function canSeeViewCount(post, currentUserId) {
  if (!post) return false
  if (post.ai_status === 'ai_free') return true
  if (post.ai_status === 'ai_contributed') return currentUserId && currentUserId === post.user_id
  return false
}

export function canUseSelectionComments(post) {
  return post?.ai_status === 'ai_free'
}
