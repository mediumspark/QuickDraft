import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { UserPlus, UserMinus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AiBadge from '@/components/AiBadge'
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import {
  getProfile,
  listWriterPosts,
  isFollowingUser,
  followUser,
  unfollowUser,
  authorLabel,
} from '@/services/supabase'
import { plainPreview } from '@/utils/richText'

export default function WriterProfile() {
  const { userId } = useParams()
  const { user, isAuthConfigured } = useAuth()
  const { addToast } = useToast()

  const [profile, setProfile] = React.useState(null)
  const [posts, setPosts] = React.useState([])
  const [following, setFollowing] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [followBusy, setFollowBusy] = React.useState(false)
  const [authOpen, setAuthOpen] = React.useState(false)

  const isSelf = user?.id && user.id === userId

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [{ data: p }, { data: writerPosts }, followState] = await Promise.all([
        getProfile(userId),
        listWriterPosts(userId),
        user && user.id !== userId ? isFollowingUser(userId) : Promise.resolve({ following: false }),
      ])
      if (cancelled) return
      setProfile(p)
      setPosts(writerPosts || [])
      setFollowing(!!followState.following)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [userId, user])

  const toggleFollow = async () => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    setFollowBusy(true)
    try {
      if (following) {
        const { error } = await unfollowUser(userId)
        if (error) throw error
        setFollowing(false)
        addToast('Unfollowed')
      } else {
        const { error } = await followUser(userId)
        if (error) throw error
        setFollowing(true)
        addToast('Following — you’ll get updates when they share something new')
      }
    } catch (err) {
      addToast(err.message || 'Could not update follow', 'error')
    } finally {
      setFollowBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !profile ? (
          <p className="text-muted-foreground">Writer not found.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold">{authorLabel(profile)}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Shared work from this account. Follow to hear about new posts.
                </p>
              </div>
              {!isSelf && (
                <Button variant={following ? 'outline' : 'default'} onClick={toggleFollow} disabled={followBusy}>
                  {following ? <UserMinus className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                  {following ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>

            {posts.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No shared posts yet.</p>
            ) : (
              <ul className="space-y-4">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/forum/post/${p.id}`}
                      className="block rounded-xl border bg-card p-5 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="font-semibold text-lg">{p.title}</h2>
                        {p.post_kind !== 'discussion' && <AiBadge status={p.ai_status} />}
                      </div>
                      {p.forum_boards?.name && (
                        <p className="text-xs text-muted-foreground mb-2">{p.forum_boards.name}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 font-document">
                        {plainPreview(p.body, 180)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        redirectPath={`/writers/${userId}`}
        isConfigured={isAuthConfigured}
      />
    </div>
  )
}
