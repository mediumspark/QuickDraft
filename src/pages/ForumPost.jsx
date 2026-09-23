import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Eye, MessageSquarePlus, Trash2, Bell, BellOff, UserPlus, UserMinus,
  ThumbsUp, Gift,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AiBadge from '@/components/AiBadge'
import AuthModal from '@/components/AuthModal'
import GiveAwardModal, { AwardIconBySlug } from '@/components/GiveAwardModal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { FEEDBACK_VISIBILITY } from '@/data/writing'
import { normalizeChapters } from '@/data/chapters'
import { normalizePageLayout } from '@/data/pageLayout'
import { PaginatedPageSurface } from '@/components/PaginatedPageSurface'
import {
  getForumPost,
  getDraft,
  recordPostView,
  listComments,
  createComment,
  deleteComment,
  updateForumPost,
  authorLabel,
  canSeeViewCount,
  canUseSelectionComments,
  isFollowingUser,
  followUser,
  unfollowUser,
  isWatchingProject,
  watchProject,
  unwatchProject,
  getPostUpvoteStats,
  castUpvote,
  listPostAwards,
} from '@/services/supabase'
import {
  looksLikeHtml,
  stripHtml,
  sanitizeHtml,
  extractEmbeddedFonts,
  ensureFontsFromCss,
} from '@/utils/richText'
import { cn } from '@/lib/utils'

function getOffsetsInBody(bodyEl, range) {
  const pre = document.createRange()
  pre.selectNodeContents(bodyEl)
  pre.setEnd(range.startContainer, range.startOffset)
  const start = pre.toString().length
  const selected = range.toString()
  return { start, end: start + selected.length, quote: selected }
}

function highlightSegments(text, selectionComments) {
  if (!selectionComments?.length) {
    return [{ type: 'text', value: text }]
  }
  const sorted = [...selectionComments]
    .filter((c) => c.anchor_type === 'selection')
    .sort((a, b) => a.start_offset - b.start_offset)

  const parts = []
  let cursor = 0
  for (const c of sorted) {
    const start = Math.max(0, Math.min(c.start_offset, text.length))
    const end = Math.max(start, Math.min(c.end_offset, text.length))
    if (start < cursor) continue
    if (start > cursor) {
      parts.push({ type: 'text', value: text.slice(cursor, start) })
    }
    parts.push({ type: 'mark', value: text.slice(start, end), commentId: c.id })
    cursor = end
  }
  if (cursor < text.length) {
    parts.push({ type: 'text', value: text.slice(cursor) })
  }
  return parts.length ? parts : [{ type: 'text', value: text }]
}

export default function ForumPost() {
  const { id } = useParams()
  const { user, isAuthConfigured } = useAuth()
  const { addToast } = useToast()

  const [post, setPost] = React.useState(null)
  const [comments, setComments] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [authOpen, setAuthOpen] = React.useState(false)
  const [generalBody, setGeneralBody] = React.useState('')
  const [selectionDraft, setSelectionDraft] = React.useState(null)
  const [selectionText, setSelectionText] = React.useState('')
  const [posting, setPosting] = React.useState(false)
  const [activeCommentId, setActiveCommentId] = React.useState(null)
  const [following, setFollowing] = React.useState(false)
  const [watching, setWatching] = React.useState(false)
  const [subBusy, setSubBusy] = React.useState(false)
  const [pushing, setPushing] = React.useState(false)
  const [activeChapter, setActiveChapter] = React.useState(0)
  const [upvoteStats, setUpvoteStats] = React.useState({ count: 0, totalWeight: 0, mine: false })
  const [postAwards, setPostAwards] = React.useState([])
  const [awardOpen, setAwardOpen] = React.useState(false)
  const [voteBusy, setVoteBusy] = React.useState(false)
  const bodyRef = React.useRef(null)

  const isAuthor = user?.id && post?.user_id === user.id
  const showViews = canSeeViewCount(post, user?.id)
  const allowSelection = canUseSelectionComments(post)

  const selectionComments = comments.filter((c) => c.anchor_type === 'selection')
  const generalComments = comments.filter((c) => c.anchor_type === 'general')

  const loadComments = React.useCallback(async () => {
    const { data } = await listComments(id)
    setComments(data || [])
  }, [id])

  const loadSubscriptionState = React.useCallback(async (postData) => {
    if (!user || !postData) {
      setFollowing(false)
      setWatching(false)
      return
    }
    if (user.id === postData.user_id) {
      setFollowing(false)
      const { watching: w } = await isWatchingProject(postData.id)
      setWatching(!!w)
      return
    }
    const [followState, watchState] = await Promise.all([
      isFollowingUser(postData.user_id),
      isWatchingProject(postData.id),
    ])
    setFollowing(!!followState.following)
    setWatching(!!watchState.watching)
  }, [user])

  const loadEngagement = React.useCallback(async () => {
    if (!id) return
    const [votes, awards] = await Promise.all([
      getPostUpvoteStats(id),
      listPostAwards(id),
    ])
    setUpvoteStats({
      count: votes.count || 0,
      totalWeight: votes.totalWeight || 0,
      mine: !!votes.mine,
    })
    setPostAwards(awards.data || [])
  }, [id])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await getForumPost(id)
      if (cancelled) return
      if (error || !data) {
        addToast('Post not found', 'error')
        setLoading(false)
        return
      }
      setPost(data)
      setActiveChapter(0)
      setLoading(false)
      await loadSubscriptionState(data)

      if (data.ai_status === 'ai_free' || data.ai_status === 'ai_contributed') {
        const { count } = await recordPostView(data.id)
        if (!cancelled && typeof count === 'number') {
          setPost((p) => (p ? { ...p, view_count: count } : p))
        }
      }

      await Promise.all([loadComments(), loadEngagement()])
    })()
    return () => { cancelled = true }
  }, [id, addToast, loadComments, loadSubscriptionState, loadEngagement])

  const handleMouseUp = () => {
    if (!allowSelection || !bodyRef.current) return
    if (!user) {
      setAuthOpen(true)
      return
    }
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelectionDraft(null)
      return
    }
    const range = sel.getRangeAt(0)
    if (!bodyRef.current.contains(range.commonAncestorContainer)) {
      setSelectionDraft(null)
      return
    }
    const { start, end, quote } = getOffsetsInBody(bodyRef.current, range)
    if (!quote.trim() || end <= start) {
      setSelectionDraft(null)
      return
    }
    setSelectionDraft({ start, end, quote: quote.trim() })
    setSelectionText('')
  }

  const requireAuth = () => {
    if (!user) {
      setAuthOpen(true)
      return false
    }
    return true
  }

  const submitSelectionComment = async () => {
    if (!requireAuth() || !selectionDraft || !selectionText.trim()) return
    setPosting(true)
    try {
      const { error } = await createComment({
        postId: id,
        body: selectionText.trim(),
        anchorType: 'selection',
        startOffset: selectionDraft.start,
        endOffset: selectionDraft.end,
        quoteText: selectionDraft.quote,
      })
      if (error) throw error
      setSelectionDraft(null)
      setSelectionText('')
      window.getSelection()?.removeAllRanges()
      addToast('Comment added')
      await loadComments()
    } catch (err) {
      addToast(err.message || 'Could not comment', 'error')
    } finally {
      setPosting(false)
    }
  }

  const submitGeneralComment = async () => {
    if (!requireAuth() || !generalBody.trim()) return
    setPosting(true)
    try {
      const { error } = await createComment({
        postId: id,
        body: generalBody.trim(),
        anchorType: 'general',
      })
      if (error) throw error
      setGeneralBody('')
      addToast('Comment added')
      await loadComments()
    } catch (err) {
      addToast(err.message || 'Could not comment', 'error')
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    const { error } = await deleteComment(commentId)
    if (error) {
      addToast('Could not delete', 'error')
      return
    }
    await loadComments()
  }

  const handleVisibilityChange = async (value) => {
    const { data, error } = await updateForumPost(id, { feedback_visibility: value })
    if (error) {
      addToast('Could not update visibility', 'error')
      return
    }
    setPost(data)
    addToast('Feedback visibility updated')
    await loadComments()
  }

  const toggleFollow = async () => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    if (!post?.user_id || isAuthor) return
    setSubBusy(true)
    try {
      if (following) {
        const { error } = await unfollowUser(post.user_id)
        if (error) throw error
        setFollowing(false)
        addToast('Unfollowed')
      } else {
        const { error } = await followUser(post.user_id)
        if (error) throw error
        setFollowing(true)
        addToast('Following this writer')
      }
    } catch (err) {
      addToast(err.message || 'Could not update follow', 'error')
    } finally {
      setSubBusy(false)
    }
  }

  const toggleWatch = async () => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    setSubBusy(true)
    try {
      if (watching) {
        const { error } = await unwatchProject(id)
        if (error) throw error
        setWatching(false)
        addToast('Stopped watching this project')
      } else {
        const { error } = await watchProject(id)
        if (error) throw error
        setWatching(true)
        addToast('Watching — you’ll get updates when this project changes')
      }
    } catch (err) {
      addToast(err.message || 'Could not update watch', 'error')
    } finally {
      setSubBusy(false)
    }
  }

  const pushDraftUpdate = async () => {
    if (!post?.draft_id) {
      addToast('No linked draft to push from', 'error')
      return
    }
    setPushing(true)
    try {
      const { data: draft, error: draftError } = await getDraft(post.draft_id)
      if (draftError || !draft) throw draftError || new Error('Draft not found')
      const chapters = normalizeChapters(draft.chapters, draft.body || '')
      const { data, error } = await updateForumPost(id, {
        title: draft.title || post.title,
        body: draft.body || '',
        chapters,
        page_layout: draft.page_layout || post.page_layout,
        page_count: draft.page_count || post.page_count,
      })
      if (error) throw error
      setPost(data)
      setActiveChapter(0)
      addToast('Shared project updated — watchers notified')
    } catch (err) {
      addToast(err.message || 'Could not update shared project', 'error')
    } finally {
      setPushing(false)
    }
  }

  const handleUpvote = async () => {
    if (!requireAuth()) return
    if (isAuthor) {
      addToast('You can’t upvote your own work', 'error')
      return
    }
    if (upvoteStats.mine) {
      addToast('You already upvoted this')
      return
    }
    setVoteBusy(true)
    try {
      const { data, error } = await castUpvote(id)
      if (error) throw error
      addToast(
        data?.author_granted
          ? `Upvoted (+${data.weight} pts gifted)`
          : `Upvoted (weight ${data?.weight || 5}; author earns once verified)`
      )
      await loadEngagement()
    } catch (err) {
      addToast(err.message || 'Could not upvote', 'error')
    } finally {
      setVoteBusy(false)
    }
  }

  const chapters = React.useMemo(
    () => normalizeChapters(post?.chapters, post?.body || ''),
    [post?.chapters, post?.body]
  )
  const chapterIndex = Math.min(activeChapter, Math.max(0, chapters.length - 1))
  const activeCh = chapters[chapterIndex]
  const pageLayout = normalizePageLayout(post?.page_layout)

  const chapterHtml = React.useMemo(() => {
    const raw = activeCh?.body || ''
    if (!raw || !looksLikeHtml(raw)) return null
    const { fontsCss, bodyHtml } = extractEmbeddedFonts(raw)
    if (fontsCss) ensureFontsFromCss(fontsCss)
    return sanitizeHtml(bodyHtml)
  }, [activeCh?.body])

  const htmlBody = React.useMemo(() => {
    if (chapters.length > 1) return null
    if (!post?.body || !looksLikeHtml(post.body)) return null
    const { fontsCss, bodyHtml } = extractEmbeddedFonts(post.body || '')
    if (fontsCss) ensureFontsFromCss(fontsCss)
    return sanitizeHtml(bodyHtml)
  }, [post?.body, chapters.length])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <p className="mb-4">Post not found.</p>
          <Link to="/forum" className="text-primary hover:underline">Back to forum</Link>
        </main>
        <Footer />
      </div>
    )
  }

  const displayBody = activeCh?.body || post.body || ''
  const segments = highlightSegments(
    looksLikeHtml(displayBody) ? stripHtml(displayBody) : displayBody,
    selectionComments
  )
  const useChapterMode = post.post_kind !== 'discussion' && chapters.length >= 1
  const renderedHtml = useChapterMode ? chapterHtml : htmlBody

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <div className="text-sm text-muted-foreground">
          <Link to="/forum" className="hover:text-foreground">Forum</Link>
          {post.forum_boards?.slug && (
            <>
              <span className="mx-1.5">/</span>
              <Link to={`/forum/${post.forum_boards.slug}`} className="hover:text-foreground">
                {post.forum_boards.name}
              </Link>
            </>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <article>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{post.title}</h1>
              {post.post_kind !== 'discussion' && <AiBadge status={post.ai_status} />}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
              <Link to={`/writers/${post.user_id}`} className="hover:text-foreground">
                {authorLabel(post.profiles)}
              </Link>
              <span>{new Date(post.created_at).toLocaleString()}</span>
              {post.post_kind !== 'discussion' && (
                <span>
                  {post.page_count || 1} page{(post.page_count || 1) === 1 ? '' : 's'}
                </span>
              )}
              {showViews && post.post_kind !== 'discussion' && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.view_count || 0} views
                  {post.ai_status === 'ai_contributed' && isAuthor ? ' (only you)' : ''}
                </span>
              )}
            </div>

            {post.post_kind !== 'discussion' && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Button
                  size="sm"
                  variant={upvoteStats.mine ? 'secondary' : 'outline'}
                  disabled={voteBusy || isAuthor}
                  onClick={handleUpvote}
                >
                  {voteBusy ? <Spinner size="sm" /> : <ThumbsUp className="h-4 w-4 mr-1" />}
                  Upvote
                  {upvoteStats.count > 0 && (
                    <span className="ml-1 tabular-nums">({upvoteStats.count} · wt {upvoteStats.totalWeight})</span>
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={() => (requireAuth() ? setAwardOpen(true) : null)}>
                  <Gift className="h-4 w-4 mr-1" />
                  Award
                </Button>
                {postAwards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-1">
                    {postAwards.map((pa) => (
                      <span
                        key={pa.id}
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                        title={pa.awards?.name}
                      >
                        <AwardIconBySlug icon={pa.awards?.icon} className="h-3 w-3" />
                        {pa.awards?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {useChapterMode && chapters.length > 1 && (
              <nav className="mb-6 rounded-xl border bg-card/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Contents</p>
                <ol className="flex flex-wrap gap-2">
                  {chapters.map((ch, i) => (
                    <li key={ch.id}>
                      <button
                        type="button"
                        onClick={() => setActiveChapter(i)}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-sm',
                          i === chapterIndex ? 'border-primary bg-accent' : 'border-border hover:border-primary/40'
                        )}
                      >
                        {ch.title || `Chapter ${i + 1}`}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {useChapterMode && chapters.length > 1 && (
              <h2 className="text-xl font-semibold mb-3">{activeCh?.title || `Chapter ${chapterIndex + 1}`}</h2>
            )}

            {post.post_kind !== 'discussion' ? (
              <PaginatedPageSurface layout={pageLayout} scale={0.72} className="mb-2">
                <div
                  ref={bodyRef}
                  onMouseUp={handleMouseUp}
                  className="qd-prose font-document leading-relaxed select-text"
                >
                  {renderedHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {segments.map((seg, i) =>
                        seg.type === 'mark' ? (
                          <mark
                            key={i}
                            className={cn(
                              'bg-accent cursor-pointer rounded-sm px-0.5',
                              activeCommentId === seg.commentId && 'ring-2 ring-primary'
                            )}
                            onClick={() => setActiveCommentId(seg.commentId)}
                          >
                            {seg.value}
                          </mark>
                        ) : (
                          <React.Fragment key={i}>{seg.value}</React.Fragment>
                        )
                      )}
                    </div>
                  )}
                </div>
              </PaginatedPageSurface>
            ) : (
              <div
                ref={bodyRef}
                onMouseUp={handleMouseUp}
                className="qd-prose font-document text-lg leading-relaxed select-text"
              >
                {renderedHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                ) : (
                  <div className="whitespace-pre-wrap">
                    {segments.map((seg, i) =>
                      seg.type === 'mark' ? (
                        <mark
                          key={i}
                          className={cn(
                            'bg-accent cursor-pointer rounded-sm px-0.5',
                            activeCommentId === seg.commentId && 'ring-2 ring-primary'
                          )}
                          onClick={() => setActiveCommentId(seg.commentId)}
                        >
                          {seg.value}
                        </mark>
                      ) : (
                        <React.Fragment key={i}>{seg.value}</React.Fragment>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {selectionDraft && allowSelection && (
              <div className="mt-6 rounded-lg border bg-card p-4 space-y-3">
                <p className="text-sm font-medium">Comment on selection</p>
                <blockquote className="text-sm italic text-muted-foreground border-l-2 pl-3">
                  “{selectionDraft.quote}”
                </blockquote>
                <Textarea
                  value={selectionText}
                  onChange={(e) => setSelectionText(e.target.value)}
                  placeholder="Your feedback…"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitSelectionComment} disabled={posting}>
                    <MessageSquarePlus className="h-4 w-4 mr-1" />
                    Comment
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectionDraft(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <section className="mt-10 border-t pt-8">
              <h2 className="text-xl font-semibold mb-4">
                {post.post_kind === 'discussion' ? 'Replies' : 'Comments on the whole work'}
              </h2>
              <div className="space-y-3 mb-6">
                {generalComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {post.post_kind === 'discussion' ? 'No replies yet.' : 'No general comments yet.'}
                  </p>
                ) : (
                  generalComments.map((c) => (
                    <div key={c.id} className="rounded-lg border p-3">
                      <div className="flex justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {authorLabel(c.profiles)} · {new Date(c.created_at).toLocaleString()}
                        </p>
                        {(user?.id === c.user_id || isAuthor) && (
                          <button type="button" onClick={() => handleDeleteComment(c.id)} aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <Label>{post.post_kind === 'discussion' ? 'Reply' : 'Leave a general comment'}</Label>
                {user ? (
                  <>
                    <Textarea
                      value={generalBody}
                      onChange={(e) => setGeneralBody(e.target.value)}
                      placeholder={
                        post.post_kind === 'discussion'
                          ? 'Write a reply…'
                          : 'Your thoughts on the whole piece…'
                      }
                      rows={3}
                    />
                    <Button onClick={submitGeneralComment} disabled={posting || !generalBody.trim()}>
                      {posting ? <Spinner size="sm" /> : null}
                      {post.post_kind === 'discussion' ? 'Reply' : 'Post comment'}
                    </Button>
                  </>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Sign in to comment in the forums.
                    </p>
                    <Button type="button" onClick={() => setAuthOpen(true)}>Sign in to comment</Button>
                  </div>
                )}
              </div>
            </section>
          </article>

          <aside className="space-y-6">
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h3 className="font-semibold">Subscriptions</h3>
              <p className="text-xs text-muted-foreground">
                Follow the writer for new shares. Watch this project for updates to this piece.
              </p>
              {!isAuthor && (
                <Button
                  variant={following ? 'outline' : 'default'}
                  className="w-full"
                  disabled={subBusy}
                  onClick={toggleFollow}
                >
                  {following ? <UserMinus className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                  {following ? 'Following writer' : 'Follow writer'}
                </Button>
              )}
              <Button
                variant={watching ? 'outline' : 'secondary'}
                className="w-full"
                disabled={subBusy || isAuthor}
                onClick={toggleWatch}
                title={isAuthor ? 'Authors don’t watch their own projects' : undefined}
              >
                {watching ? <BellOff className="h-4 w-4 mr-1" /> : <Bell className="h-4 w-4 mr-1" />}
                {watching ? 'Watching project' : 'Watch project'}
              </Button>
              {isAuthor && (
                <p className="text-xs text-muted-foreground">
                  Others can watch this project. Push draft changes below to notify them.
                </p>
              )}
            </div>

            {isAuthor && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <Label htmlFor="vis">Who can see feedback</Label>
                <Select
                  id="vis"
                  value={post.feedback_visibility}
                  onChange={(e) => handleVisibilityChange(e.target.value)}
                >
                  {Object.values(FEEDBACK_VISIBILITY).map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
                {post.draft_id && post.post_kind !== 'discussion' && (
                  <Button variant="outline" className="w-full" disabled={pushing} onClick={pushDraftUpdate}>
                    {pushing ? <Spinner size="sm" /> : null}
                    Push latest draft to watchers
                  </Button>
                )}
              </div>
            )}

            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold mb-3">
                {allowSelection ? 'Section comments' : 'Section comments unavailable'}
              </h3>
              {!allowSelection && (
                <p className="text-xs text-muted-foreground mb-3">
                  Highlight comments are only available on AI Free writing.
                </p>
              )}
              {allowSelection && selectionComments.length === 0 && (
                <p className="text-sm text-muted-foreground">Highlight text in the piece to comment on a passage.</p>
              )}
              <ul className="space-y-3">
                {selectionComments.map((c) => (
                  <li
                    key={c.id}
                    className={cn(
                      'rounded-md border p-3 text-sm cursor-pointer',
                      activeCommentId === c.id && 'border-primary bg-accent/40'
                    )}
                    onClick={() => setActiveCommentId(c.id)}
                  >
                    <p className="text-xs italic text-muted-foreground line-clamp-2 mb-1">
                      “{c.quote_text}”
                    </p>
                    <p className="whitespace-pre-wrap">{c.body}</p>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{authorLabel(c.profiles)}</span>
                      {(user?.id === c.user_id || isAuthor) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteComment(c.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath={`/forum/post/${id}`} isConfigured={isAuthConfigured} />
      <GiveAwardModal
        open={awardOpen}
        onOpenChange={setAwardOpen}
        postId={id}
        onGiven={loadEngagement}
        addToast={addToast}
      />
    </div>
  )
}
