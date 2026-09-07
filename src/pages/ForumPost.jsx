import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { Eye, MessageSquarePlus, Trash2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AiBadge from '@/components/AiBadge'
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { FEEDBACK_VISIBILITY } from '@/data/writing'
import {
  getForumPost,
  recordPostView,
  listComments,
  createComment,
  deleteComment,
  updateForumPost,
  authorLabel,
  canSeeViewCount,
  canUseSelectionComments,
} from '@/services/supabase'
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
      setLoading(false)

      if (data.ai_status === 'ai_free' || data.ai_status === 'ai_contributed') {
        const { count } = await recordPostView(data.id)
        if (!cancelled && typeof count === 'number') {
          setPost((p) => (p ? { ...p, view_count: count } : p))
        }
      }

      await loadComments()
    })()
    return () => { cancelled = true }
  }, [id, addToast, loadComments])

  const handleMouseUp = () => {
    if (!allowSelection || !bodyRef.current) return
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

  const segments = highlightSegments(post.body || '', selectionComments)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <Link to="/forum" className="text-sm text-muted-foreground hover:text-foreground">← Forum</Link>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <article>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{post.title}</h1>
              <AiBadge status={post.ai_status} />
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-6">
              <span>{authorLabel(post.profiles)}</span>
              <span>{new Date(post.created_at).toLocaleString()}</span>
              {showViews && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.view_count || 0} views
                  {post.ai_status === 'ai_contributed' && isAuthor ? ' (only you)' : ''}
                </span>
              )}
            </div>

            <div
              ref={bodyRef}
              onMouseUp={handleMouseUp}
              className="font-document text-lg leading-relaxed whitespace-pre-wrap select-text"
            >
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
              <h2 className="text-xl font-semibold mb-4">Comments on the whole work</h2>
              <div className="space-y-3 mb-6">
                {generalComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No general comments yet.</p>
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
                <Label>Leave a general comment</Label>
                <Textarea
                  value={generalBody}
                  onChange={(e) => setGeneralBody(e.target.value)}
                  placeholder={user ? 'Your thoughts on the whole piece…' : 'Sign in to comment'}
                  rows={3}
                  disabled={!user}
                />
                <Button onClick={submitGeneralComment} disabled={posting || !user}>
                  {user ? 'Post comment' : 'Sign in to comment'}
                </Button>
                {!user && (
                  <Button variant="outline" className="ml-2" onClick={() => setAuthOpen(true)}>
                    Sign in
                  </Button>
                )}
              </div>
            </section>
          </article>

          <aside className="space-y-6">
            {isAuthor && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
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
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath={`/forum/${id}`} isConfigured={isAuthConfigured} />
    </div>
  )
}
