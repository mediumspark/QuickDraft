import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AiBadge from '@/components/AiBadge'
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import {
  getForumBoard,
  listForumPosts,
  createDiscussionPost,
  authorLabel,
  canSeeViewCount,
} from '@/services/supabase'
import { boardBySlug } from '@/data/forumBoards'
import { plainPreview } from '@/utils/richText'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function ForumBoard() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, isAuthConfigured } = useAuth()
  const { addToast } = useToast()

  const [board, setBoard] = React.useState(null)
  const [posts, setPosts] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [authOpen, setAuthOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [posting, setPosting] = React.useState(false)

  React.useEffect(() => {
    if (UUID_RE.test(slug || '')) {
      navigate(`/forum/post/${slug}`, { replace: true })
    }
  }, [slug, navigate])

  const refresh = React.useCallback(async () => {
    const fallback = boardBySlug(slug)
    const { data: boardData, error: boardError } = await getForumBoard(slug)
    const nextBoard = boardData || (fallback
      ? {
          slug: fallback.slug,
          name: fallback.name,
          description: fallback.description,
          kind: fallback.kind,
        }
      : null)

    if (!nextBoard) {
      setError(boardError?.message || 'Forum not found')
      setBoard(null)
      setPosts([])
      setLoading(false)
      return
    }

    setBoard(nextBoard)
    const { data, error: postsError } = await listForumPosts(slug)
    if (postsError) setError(postsError.message || 'Could not load posts')
    else setError('')
    setPosts(data || [])
    setLoading(false)
  }, [slug])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      await refresh()
      if (cancelled) return
    })()
    return () => { cancelled = true }
  }, [refresh])

  const isCommunity = board?.kind === 'community'

  const handleCreateDiscussion = async (e) => {
    e.preventDefault()
    if (!user) {
      setAuthOpen(true)
      return
    }
    if (!title.trim() || !body.trim()) {
      addToast('Add a title and message', 'error')
      return
    }
    setPosting(true)
    try {
      const { data, error: err } = await createDiscussionPost({
        boardSlug: slug,
        title: title.trim(),
        body: body.trim(),
      })
      if (err) throw err
      addToast('Posted')
      setTitle('')
      setBody('')
      navigate(`/forum/post/${data.id}`)
    } catch (err) {
      addToast(err.message || 'Could not post', 'error')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/forum" className="text-sm text-muted-foreground hover:text-foreground">
          ← All forums
        </Link>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !board ? (
          <p className="text-destructive text-sm mt-6">{error || 'Forum not found'}</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold mt-4 mb-2">{board.name}</h1>
            <p className="text-muted-foreground mb-8">{board.description}</p>

            {isCommunity && (
              <form onSubmit={handleCreateDiscussion} className="rounded-xl border bg-card p-4 mb-8 space-y-3">
                <h2 className="font-semibold">Start a thread</h2>
                <p className="text-xs text-muted-foreground">
                  Signed-in accounts only. Replies also require sign-in.
                </p>
                {!user ? (
                  <Button type="button" onClick={() => setAuthOpen(true)}>Sign in to post</Button>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="thread-title">Title</Label>
                      <Input
                        id="thread-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What’s this about?"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="thread-body">Message</Label>
                      <Textarea
                        id="thread-body"
                        rows={4}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your post…"
                      />
                    </div>
                    <Button type="submit" disabled={posting}>
                      {posting ? <Spinner size="sm" /> : null}
                      {posting ? 'Posting…' : 'Post'}
                    </Button>
                  </>
                )}
              </form>
            )}

            {!isCommunity && (
              <p className="text-sm text-muted-foreground mb-6">
                Share writing here from the{' '}
                <Link to="/write" className="text-primary hover:underline">writing room</Link>
                {' '}— pick this board when you publish.
              </p>
            )}

            {error && <p className="text-destructive text-sm mb-4">{error}</p>}

            {posts.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No posts in this forum yet.</p>
            ) : (
              <ul className="space-y-4">
                {posts.map((p) => {
                  const showViews = canSeeViewCount(p, user?.id)
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/forum/post/${p.id}`}
                        className="block rounded-xl border bg-card p-5 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="font-semibold text-lg">{p.title}</h2>
                          {p.post_kind !== 'discussion' && <AiBadge status={p.ai_status} />}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 font-document">
                          {plainPreview(p.body, 220)}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                          <span>{authorLabel(p.profiles)}</span>
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                          {showViews && p.post_kind !== 'discussion' && (
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {p.view_count || 0} view{(p.view_count || 0) === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        redirectPath={`/forum/${slug}`}
        isConfigured={isAuthConfigured}
      />
    </div>
  )
}
