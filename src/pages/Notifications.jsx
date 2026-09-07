import * as React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import {
  listNotifications,
  markNotificationsRead,
  authorLabel,
} from '@/services/supabase'
import { cn } from '@/lib/utils'

export default function Notifications() {
  const { user, loading: authLoading, isAuthConfigured } = useAuth()
  const { addToast } = useToast()
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [authOpen, setAuthOpen] = React.useState(false)

  const refresh = React.useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await listNotifications()
    if (error) addToast(error.message || 'Could not load updates', 'error')
    setItems(data || [])
    setLoading(false)
    const unread = (data || []).filter((n) => !n.read_at).map((n) => n.id)
    if (unread.length) await markNotificationsRead(unread)
  }, [user, addToast])

  React.useEffect(() => {
    if (!authLoading) refresh()
  }, [authLoading, refresh])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Updates</h1>
        <p className="text-muted-foreground mb-8">
          New shares from writers you follow, and changes to projects you watch.
        </p>

        {!user && !authLoading ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to see your subscriptions.</p>
            <Button onClick={() => setAuthOpen(true)}>Sign in</Button>
          </div>
        ) : loading || authLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">
            No updates yet. Follow a writer or watch a project from a forum post.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  to={n.post_id ? `/forum/post/${n.post_id}` : '/forum'}
                  className={cn(
                    'block rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors',
                    !n.read_at && 'border-primary/30 bg-accent/30'
                  )}
                >
                  <p className="text-sm">
                    <span className="font-medium">{authorLabel(n.profiles)}</span>
                    {' '}
                    {n.message || (n.type === 'new_post' ? 'shared something new' : 'updated a project')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath="/updates" isConfigured={isAuthConfigured} />
    </div>
  )
}
