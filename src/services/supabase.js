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

async function ensureCurrentProfile(user) {
  if (!supabase || !user) return
  const displayName =
    user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split('@')[0]
    || 'Writer'
  await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      display_name: displayName,
    },
    { onConflict: 'id' }
  )
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
  let plain = text || ''
  if (/<\/?[a-z][\s\S]*>/i.test(plain)) {
    const el = document.createElement('div')
    el.innerHTML = plain
    plain = el.textContent || el.innerText || ''
  }
  const trimmed = plain.replace(/\u00a0/g, ' ').trim()
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
  await ensureCurrentProfile(user)

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

export async function listForumBoards() {
  if (!supabase) {
    const { FORUM_BOARDS } = await import('@/data/forumBoards')
    return {
      data: FORUM_BOARDS.map((b) => ({
        slug: b.slug,
        name: b.name,
        description: b.description,
        kind: b.kind,
        sort_order: b.sortOrder,
      })),
      error: null,
      offline: true,
    }
  }
  const { data, error } = await supabase
    .from('forum_boards')
    .select('*')
    .order('sort_order', { ascending: true })
  return { data: data || [], error }
}

export async function getForumBoard(slug) {
  if (!supabase) {
    const { boardBySlug } = await import('@/data/forumBoards')
    const b = boardBySlug(slug)
    return {
      data: b
        ? {
            slug: b.slug,
            name: b.name,
            description: b.description,
            kind: b.kind,
            sort_order: b.sortOrder,
          }
        : null,
      error: b ? null : new Error('Board not found'),
      offline: true,
    }
  }
  const { data, error } = await supabase
    .from('forum_boards')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return { data, error }
}

export async function listForumPosts(boardSlug) {
  if (!supabase) return { data: [], error: null, offline: true }
  let query = supabase
    .from('forum_posts')
    .select('*, profiles!user_id(display_name, email), forum_boards!board_id(slug, name, kind)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (boardSlug) {
    const { data: board, error: boardError } = await getForumBoard(boardSlug)
    if (boardError || !board?.id) {
      // offline fallback boards have no id — filter client-side after fetch if needed
      if (!board) return { data: [], error: boardError || new Error('Board not found') }
    }
    if (board?.id) {
      query = query.eq('board_id', board.id)
    }
  }

  const { data, error } = await query
  return { data: data || [], error }
}

export async function getForumPost(id) {
  if (!supabase) return { data: null, error: null, offline: true }
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, profiles!user_id(display_name, email), forum_boards!board_id(slug, name, kind)')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function publishToForum({
  title,
  body,
  draftId,
  aiStatus,
  feedbackVisibility,
  boardId,
  boardSlug,
  postKind = 'writing',
}) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  if (postKind === 'writing' && aiStatus === 'ai_generated') {
    return { data: null, error: new Error('AI-generated writing can’t be shared to the forum.') }
  }

  const user = await getCurrentUser()
  if (!user) return { data: null, error: new Error('Sign in required') }
  await ensureCurrentProfile(user)

  let resolvedBoardId = boardId || null
  if (!resolvedBoardId && boardSlug) {
    const { data: board, error: boardError } = await getForumBoard(boardSlug)
    if (boardError || !board?.id) {
      return { data: null, error: boardError || new Error('Choose a forum board') }
    }
    resolvedBoardId = board.id
  }
  if (!resolvedBoardId) {
    return { data: null, error: new Error('Choose a forum board') }
  }

  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      user_id: user.id,
      draft_id: draftId || null,
      board_id: resolvedBoardId,
      post_kind: postKind,
      title: title || 'Untitled',
      body: body || '',
      status: 'published',
      ai_status: postKind === 'discussion' ? 'ai_free' : aiStatus,
      feedback_visibility: feedbackVisibility || 'accounts_only',
    })
    .select('*, forum_boards!board_id(slug, name, kind)')
    .single()
  return { data, error }
}

export async function createDiscussionPost({ boardSlug, title, body }) {
  return publishToForum({
    title,
    body,
    boardSlug,
    postKind: 'discussion',
    aiStatus: 'ai_free',
    feedbackVisibility: 'accounts_only',
  })
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
  await ensureCurrentProfile(user)

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
  return post?.post_kind !== 'discussion' && post?.ai_status === 'ai_free'
}

// ---- Prompt of the day ----

export async function getPromptOfTheDay() {
  if (!supabase) return { data: null, error: null, offline: true }
  const { data, error } = await supabase
    .from('prompt_of_the_day')
    .select('body, updated_at')
    .eq('id', 1)
    .maybeSingle()
  return { data, error }
}

export async function setPromptOfTheDay(body) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  const user = await getCurrentUser()
  if (!user) return { data: null, error: new Error('Sign in required') }

  const payload = {
    id: 1,
    body: (body || '').trim(),
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }

  const { data, error } = await supabase
    .from('prompt_of_the_day')
    .upsert(payload, { onConflict: 'id' })
    .select('body, updated_at')
    .single()
  return { data, error }
}
