import * as React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AiBadge from '@/components/AiBadge'
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import {
  listFollowedWriters,
  listWatchedProjects,
  authorLabel,
  unfollowUser,
  unwatchProject,
} from '@/services/supabase'
import { plainPreview } from '@/utils/richText'
import { cn } from '@/lib/utils'

export default function Following() {
  const { user, loading: authLoading, isAuthConfigured } = useAuth()
  const { addToast } = useToast()
  const [tab, setTab] = React.useState('writers') // writers | works
  const [writers, setWriters] = React.useState([])
  const [works, setWorks] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [authOpen, setAuthOpen] = React.useState(false)

  const refresh = React.useCallback(async () => {
    if (!user) {
      setWriters([])
      setWorks([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [wRes, pRes] = await Promise.all([
      listFollowedWriters(),
      listWatchedProjects(),
    ])
    if (wRes.error) addToast(wRes.error.message || 'Could not load followed writers', 'error')
    if (pRes.error) addToast(pRes.error.message || 'Could not load watched works', 'error')
    setWriters(wRes.data || [])
    setWorks(pRes.data || [])
    setLoading(false)
  }, [user, addToast])

  React.useEffect(() => {
    if (!authLoading) refresh()
  }, [authLoading, refresh])

  const handleUnfollow = async (id) => {
    const { error } = await unfollowUser(id)
    if (error) {
      addToast(error.message || 'Could not unfollow', 'error')
      return
    }
    setWriters((list) => list.filter((w) => w.id !== id))
    addToast('Unfollowed')
  }

  const handleUnwatch = async (id) => {
    const { error } = await unwatchProject(id)
    if (error) {
      addToast(error.message || 'Could not unwatch', 'error')
      return
    }
    setWorks((list) => list.filter((w) => w.id !== id))
    addToast('Stopped watching')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Following</h1>
        <p className="text-muted-foreground mb-6">
          Writers you follow and projects you watch.
        </p>

        {!user && !authLoading ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to see your subscriptions.</p>
            <Button onClick={() => setAuthOpen(true)}>Sign in</Button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-8 border-b pb-2">
              <button
                type="button"
                onClick={() => setTab('writers')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  tab === 'writers'
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Writers ({writers.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('works')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  tab === 'works'
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Works ({works.length})
              </button>
            </div>

            {loading || authLoading ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : tab === 'writers' ? (
              writers.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  You’re not following anyone yet. Open a writer’s profile or a forum post to follow them.
                </p>
              ) : (
                <ul className="space-y-3">
                  {writers.map((w) => (
                    <li key={w.id} className="rounded-xl border bg-card p-4 flex items-center justify-between gap-3">
                      <Link to={`/writers/${w.id}`} className="min-w-0 hover:opacity-80">
                        <p className="font-semibold truncate">{authorLabel(w)}</p>
                        {w.followed_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Followed {new Date(w.followed_at).toLocaleDateString()}
                          </p>
                        )}
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => handleUnfollow(w.id)}>
                        Unfollow
                      </Button>
                    </li>
                  ))}
                </ul>
              )
            ) : works.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No watched projects yet. On a shared post, choose “Watch project”.
              </p>
            ) : (
              <ul className="space-y-3">
                {works.map((w) => (
                  <li key={w.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/forum/post/${w.id}`} className="min-w-0 flex-1 hover:opacity-80">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold">{w.title}</span>
                          {w.post_kind !== 'discussion' && <AiBadge status={w.ai_status} />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {authorLabel(w.profiles)}
                          {w.forum_boards?.name ? ` · ${w.forum_boards.name}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 font-document">
                          {plainPreview(w.body, 140)}
                        </p>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => handleUnwatch(w.id)}>
                        Unwatch
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath="/following" isConfigured={isAuthConfigured} />
    </div>
  )
}
