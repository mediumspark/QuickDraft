import { createClient } from '@supabase/supabase-js'
import { normalizeChapters, flattenChaptersBody } from '@/data/chapters'
import { DEFAULT_PAGE_LAYOUT, normalizePageLayout, estimateChaptersPageCount } from '@/data/pageLayout'

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

  const chapters = normalizeChapters(draft.chapters, draft.body || '')
  const pageLayout = normalizePageLayout(draft.page_layout || DEFAULT_PAGE_LAYOUT)
  const flatBody = flattenChaptersBody(chapters)
  const pageCount = draft.page_count
    ?? estimateChaptersPageCount(chapters, pageLayout)

  const payload = {
    title: draft.title || 'Untitled',
    body: flatBody || draft.body || '',
    chapters,
    page_layout: pageLayout,
    page_count: Math.max(1, Number(pageCount) || 1),
    prompt: draft.prompt || '',
    word_goal: draft.word_goal ?? null,
    timer_seconds: draft.timer_seconds ?? 1500,
    word_count: countWords(flatBody || draft.body),
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

  if (error && /schema cache|does not exist|Could not find/i.test(error.message || '')) {
    return {
      data: [],
      error: new Error(
        'Forum boards are not in your Supabase database yet. Run supabase/APPLY_forum_boards.sql in the SQL Editor, then refresh.'
      ),
    }
  }
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
  chapters: chaptersIn,
  pageLayout,
  pageCount,
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
      const missing = /schema cache|does not exist|Could not find/i.test(boardError?.message || '')
      return {
        data: null,
        error: new Error(
          missing
            ? 'Forum boards table missing. Run supabase/APPLY_forum_boards.sql in the Supabase SQL Editor.'
            : (boardError?.message || 'Choose a forum board')
        ),
      }
    }
    resolvedBoardId = board.id
  }
  if (!resolvedBoardId) {
    return { data: null, error: new Error('Choose a forum board') }
  }

  const chapters = normalizeChapters(chaptersIn, body || '')
  const layout = normalizePageLayout(pageLayout || DEFAULT_PAGE_LAYOUT)
  const flatBody = flattenChaptersBody(chapters) || body || ''
  const pages = Math.max(1, Number(pageCount) || estimateChaptersPageCount(chapters, layout))

  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      user_id: user.id,
      draft_id: draftId || null,
      board_id: resolvedBoardId,
      post_kind: postKind,
      title: title || 'Untitled',
      body: flatBody,
      chapters,
      page_layout: layout,
      page_count: pages,
      status: 'published',
      ai_status: postKind === 'discussion' ? 'ai_free' : aiStatus,
      feedback_visibility: feedbackVisibility || 'accounts_only',
    })
    .select('*, forum_boards!board_id(slug, name, kind)')
    .single()

  if (!error && data) {
    void notifyFollowersOfNewPost(data)
    if (postKind === 'writing') {
      void supabase.rpc('grant_publish_points', { p_post_id: data.id })
      void supabase.rpc('refresh_verified_writer', { p_user_id: user.id })
    }
  }
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
    .select('*, forum_boards!board_id(slug, name, kind), profiles!user_id(display_name, email)')
    .single()

  const contentChanged = patch && ('body' in patch || 'title' in patch || 'chapters' in patch)
  if (!error && data && contentChanged) {
    void notifyWatchersOfPostUpdate(data)
  }
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

  if (!error && data && anchorType === 'general') {
    void supabase.rpc('grant_critique_points', {
      p_post_id: postId,
      p_comment_id: data.id,
    })
    // Author verification may unlock from this critique
    const { data: post } = await supabase
      .from('forum_posts')
      .select('user_id')
      .eq('id', postId)
      .maybeSingle()
    if (post?.user_id) {
      void supabase.rpc('refresh_verified_writer', { p_user_id: post.user_id })
    }
  }
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

// ---- Follows, watches, notifications ----

const PUBLIC_PROFILE_FIELDS =
  'id, email, display_name, created_at, points_earned, is_verified_writer, avatar_url, bio, interests, is_admin'

export async function getProfile(userId) {
  if (!supabase) return { data: null, error: null, offline: true }
  const { data, error } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_FIELDS)
    .eq('id', userId)
    .maybeSingle()
  return { data, error }
}

export async function getMyWallet() {
  if (!supabase) return { data: null, error: null, offline: true }
  const user = await getCurrentUser()
  if (!user) return { data: null, error: new Error('Sign in required') }
  const { data, error } = await supabase
    .from('profile_wallets')
    .select('points_balance, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()
  return { data: data || { points_balance: 5 }, error }
}

export async function updateMyProfile(patch) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  const user = await getCurrentUser()
  if (!user) return { data: null, error: new Error('Sign in required') }

  const payload = {}
  if (typeof patch.display_name === 'string') payload.display_name = patch.display_name.trim().slice(0, 80)
  if (typeof patch.bio === 'string') payload.bio = patch.bio.trim().slice(0, 300)
  if (Array.isArray(patch.interests)) {
    payload.interests = patch.interests.filter((s) => typeof s === 'string').slice(0, 20)
  }
  if (typeof patch.avatar_url === 'string' || patch.avatar_url === null) {
    payload.avatar_url = patch.avatar_url
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select(PUBLIC_PROFILE_FIELDS)
    .single()
  return { data, error }
}

export async function uploadAvatar(file) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  const user = await getCurrentUser()
  if (!user) return { data: null, error: new Error('Sign in required') }
  if (!file) return { data: null, error: new Error('No file selected') }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${user.id}/avatar.${ext || 'jpg'}`
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
  if (upErr) return { data: null, error: upErr }

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${pub.publicUrl}?t=${Date.now()}`
  return updateMyProfile({ avatar_url: avatarUrl })
}

export async function getVerificationProgress(userId) {
  if (!supabase || !userId) {
    return {
      data: { has_writing: false, has_upvote: false, has_critique: false, is_verified_writer: false },
      error: null,
      offline: !supabase,
    }
  }

  const [{ data: posts }, profile] = await Promise.all([
    supabase
      .from('forum_posts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'published')
      .eq('post_kind', 'writing'),
    getProfile(userId),
  ])

  const writingIds = (posts || []).map((p) => p.id)
  let hasUpvote = false
  let hasCritique = false

  if (writingIds.length) {
    const [upvotes, critiques] = await Promise.all([
      supabase
        .from('post_upvotes')
        .select('post_id')
        .in('post_id', writingIds)
        .limit(1),
      supabase
        .from('forum_comments')
        .select('id, user_id')
        .in('post_id', writingIds)
        .eq('anchor_type', 'general')
        .neq('user_id', userId)
        .limit(1),
    ])
    hasUpvote = (upvotes.data || []).length > 0
    hasCritique = (critiques.data || []).length > 0
  }

  return {
    data: {
      has_writing: writingIds.length > 0,
      has_upvote: hasUpvote,
      has_critique: hasCritique,
      is_verified_writer: !!profile.data?.is_verified_writer,
      points_earned: profile.data?.points_earned ?? 5,
    },
    error: profile.error,
  }
}

export async function listWriterPosts(userId) {
  if (!supabase) return { data: [], error: null, offline: true }
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, forum_boards!board_id(slug, name, kind)')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export async function isFollowingUser(followingId) {
  if (!supabase) return { following: false, offline: true }
  const user = await getCurrentUser()
  if (!user) return { following: false }
  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .maybeSingle()
  return { following: !!data, error }
}

export async function followUser(followingId) {
  if (!supabase) return { error: new Error('Backend not configured') }
  const user = await getCurrentUser()
  if (!user) return { error: new Error('Sign in required') }
  if (user.id === followingId) return { error: new Error('You can’t follow yourself') }
  await ensureCurrentProfile(user)
  const { error } = await supabase.from('user_follows').insert({
    follower_id: user.id,
    following_id: followingId,
  })
  return { error }
}

export async function unfollowUser(followingId) {
  if (!supabase) return { error: null, offline: true }
  const user = await getCurrentUser()
  if (!user) return { error: new Error('Sign in required') }
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
  return { error }
}

export async function isWatchingProject(postId) {
  if (!supabase) return { watching: false, offline: true }
  const user = await getCurrentUser()
  if (!user) return { watching: false }
  const { data, error } = await supabase
    .from('project_watches')
    .select('post_id')
    .eq('watcher_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()
  return { watching: !!data, error }
}

export async function watchProject(postId) {
  if (!supabase) return { error: new Error('Backend not configured') }
  const user = await getCurrentUser()
  if (!user) return { error: new Error('Sign in required') }
  await ensureCurrentProfile(user)
  const { error } = await supabase.from('project_watches').insert({
    watcher_id: user.id,
    post_id: postId,
  })
  return { error }
}

export async function unwatchProject(postId) {
  if (!supabase) return { error: null, offline: true }
  const user = await getCurrentUser()
  if (!user) return { error: new Error('Sign in required') }
  const { error } = await supabase
    .from('project_watches')
    .delete()
    .eq('watcher_id', user.id)
    .eq('post_id', postId)
  return { error }
}

async function insertNotifications(rows) {
  if (!rows.length || !supabase) return { error: null }
  const { error } = await supabase.from('notifications').insert(rows)
  return { error }
}

export async function notifyFollowersOfNewPost(post) {
  if (!supabase || !post?.id || !post?.user_id) return
  const { data: followers } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('following_id', post.user_id)
  const rows = (followers || [])
    .filter((f) => f.follower_id !== post.user_id)
    .map((f) => ({
      user_id: f.follower_id,
      actor_id: post.user_id,
      post_id: post.id,
      type: 'new_post',
      message: `shared “${post.title || 'Untitled'}”`,
    }))
  await insertNotifications(rows)
}

export async function notifyWatchersOfPostUpdate(post) {
  if (!supabase || !post?.id || !post?.user_id) return
  const { data: watchers } = await supabase
    .from('project_watches')
    .select('watcher_id')
    .eq('post_id', post.id)
  const rows = (watchers || [])
    .filter((w) => w.watcher_id !== post.user_id)
    .map((w) => ({
      user_id: w.watcher_id,
      actor_id: post.user_id,
      post_id: post.id,
      type: 'post_updated',
      message: `updated “${post.title || 'Untitled'}”`,
    }))
  await insertNotifications(rows)
}

export async function listNotifications({ limit = 40 } = {}) {
  if (!supabase) return { data: [], error: null, offline: true }
  const user = await getCurrentUser()
  if (!user) return { data: [], error: new Error('Sign in required') }
  const { data, error } = await supabase
    .from('notifications')
    .select('*, profiles!actor_id(display_name, email), forum_posts!post_id(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data || [], error }
}

export async function countUnreadNotifications() {
  if (!supabase) return { count: 0, offline: true }
  const user = await getCurrentUser()
  if (!user) return { count: 0 }
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)
  return { count: count || 0, error }
}

export async function markNotificationsRead(ids) {
  if (!supabase) return { error: null, offline: true }
  const user = await getCurrentUser()
  if (!user) return { error: new Error('Sign in required') }
  const query = supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)
  if (ids?.length) query.in('id', ids)
  const { error } = await query
  return { error }
}

function escapeIlike(value) {
  return String(value || '')
    .trim()
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, ' ')
}

export async function searchSite(query, { limit = 20 } = {}) {
  if (!supabase) return { users: [], works: [], error: null, offline: true }
  const q = escapeIlike(query)
  if (!q) return { users: [], works: [], error: null }

  const pattern = `"%${q}%"`
  const [usersRes, worksRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, email, created_at, avatar_url, points_earned, is_verified_writer')
      .or(`display_name.ilike.${pattern},email.ilike.${pattern}`)
      .order('display_name', { ascending: true })
      .limit(limit),
    supabase
      .from('forum_posts')
      .select('id, title, body, ai_status, post_kind, created_at, user_id, profiles!user_id(display_name, email), forum_boards!board_id(slug, name)')
      .eq('status', 'published')
      .or(`title.ilike.${pattern},body.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  return {
    users: usersRes.data || [],
    works: worksRes.data || [],
    error: usersRes.error || worksRes.error || null,
  }
}

export async function listFollowedWriters() {
  if (!supabase) return { data: [], error: null, offline: true }
  const user = await getCurrentUser()
  if (!user) return { data: [], error: new Error('Sign in required') }

  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id, created_at, profiles!following_id(id, display_name, email)')
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false })

  return {
    data: (data || []).map((row) => ({
      followed_at: row.created_at,
      ...(row.profiles || { id: row.following_id }),
    })),
    error,
  }
}

export async function listWatchedProjects() {
  if (!supabase) return { data: [], error: null, offline: true }
  const user = await getCurrentUser()
  if (!user) return { data: [], error: new Error('Sign in required') }

  const { data, error } = await supabase
    .from('project_watches')
    .select(`
      created_at,
      post_id,
      forum_posts!post_id(
        id, title, body, ai_status, post_kind, created_at, updated_at, user_id,
        profiles!user_id(display_name, email),
        forum_boards!board_id(slug, name)
      )
    `)
    .eq('watcher_id', user.id)
    .order('created_at', { ascending: false })

  return {
    data: (data || [])
      .map((row) => row.forum_posts ? { ...row.forum_posts, watched_at: row.created_at } : null)
      .filter(Boolean),
    error,
  }
}

// ---- Upvotes & awards ----

export async function getPostUpvoteStats(postId) {
  if (!supabase) return { count: 0, totalWeight: 0, mine: false, offline: true }
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('post_upvotes')
    .select('user_id, weight')
    .eq('post_id', postId)
  const rows = data || []
  return {
    count: rows.length,
    totalWeight: rows.reduce((s, r) => s + (r.weight || 0), 0),
    mine: !!(user && rows.some((r) => r.user_id === user.id)),
    error,
  }
}

export async function castUpvote(postId) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  const { data, error } = await supabase.rpc('cast_upvote', { p_post_id: postId })
  return { data, error }
}

export async function removeUpvote(postId) {
  if (!supabase) return { error: null, offline: true }
  const user = await getCurrentUser()
  if (!user) return { error: new Error('Sign in required') }
  const { error } = await supabase
    .from('post_upvotes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id)
  return { error }
}

export async function listAwards() {
  if (!supabase) return { data: [], error: null, offline: true }
  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  return { data: data || [], error }
}

export async function listMyAwardInventory() {
  if (!supabase) return { data: [], error: null, offline: true }
  const user = await getCurrentUser()
  if (!user) return { data: [], error: new Error('Sign in required') }
  const { data, error } = await supabase
    .from('award_inventory')
    .select('quantity, award_id, awards(*)')
    .eq('user_id', user.id)
    .gt('quantity', 0)
  return { data: data || [], error }
}

export async function listPostAwards(postId) {
  if (!supabase) return { data: [], error: null, offline: true }
  const { data, error } = await supabase
    .from('post_awards')
    .select('id, created_at, award_id, giver_id, awards(*), profiles!giver_id(display_name, email)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export async function spendPointsForAward(awardId, quantity = 1) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  const { data, error } = await supabase.rpc('spend_points_for_award', {
    p_award_id: awardId,
    p_quantity: quantity,
  })
  return { data, error }
}

export async function giveAward(postId, awardId) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  const { data, error } = await supabase.rpc('give_award', {
    p_post_id: postId,
    p_award_id: awardId,
  })
  return { data, error }
}

export async function createAwardCheckout({ awardId, quantity = 1 }) {
  if (!supabase) return { data: null, error: new Error('Backend not configured') }
  const user = await getCurrentUser()
  if (!user) return { data: null, error: new Error('Sign in required') }
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/create-award-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({ awardId, quantity }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { data: null, error: new Error(json.error || 'Checkout failed') }
  }
  return { data: json, error: null }
}

