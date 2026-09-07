import * as React from 'react'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AiBadge from '@/components/AiBadge'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { listForumPosts, authorLabel, canSeeViewCount } from '@/services/supabase'

export default function Forum() {
  const { user } = useAuth()
  const [posts, setPosts] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error: err } = await listForumPosts()
      if (cancelled) return
      if (err) setError(err.message || 'Could not load forum')
      setPosts(data || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Forum</h1>
        <p className="text-muted-foreground mb-8">
          Shared writing from the community. AI Free works show public views; AI Contributed views are private to authors.
        </p>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">
            Nothing published yet.{' '}
            <Link to="/write" className="text-primary hover:underline">Write something</Link>.
          </p>
        ) : (
          <ul className="space-y-4">
            {posts.map((p) => {
              const showViews = canSeeViewCount(p, user?.id)
              return (
                <li key={p.id}>
                  <Link
                    to={`/forum/${p.id}`}
                    className="block rounded-xl border bg-card p-5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="font-semibold text-lg">{p.title}</h2>
                      <AiBadge status={p.ai_status} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 font-document">
                      {(p.body || '').slice(0, 220)}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{authorLabel(p.profiles)}</span>
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                      {showViews && (
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {p.view_count || 0} view{(p.view_count || 0) === 1 ? '' : 's'}
                          {p.ai_status === 'ai_contributed' ? ' (only you)' : ''}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
