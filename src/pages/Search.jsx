import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AiBadge from '@/components/AiBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { searchSite, authorLabel } from '@/services/supabase'
import { plainPreview } from '@/utils/richText'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const initial = params.get('q') || ''
  const [query, setQuery] = React.useState(initial)
  const [users, setUsers] = React.useState([])
  const [works, setWorks] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [searched, setSearched] = React.useState(false)

  const runSearch = React.useCallback(async (raw) => {
    const q = (raw || '').trim()
    setParams(q ? { q } : {})
    if (!q) {
      setUsers([])
      setWorks([])
      setSearched(false)
      setError('')
      return
    }
    setLoading(true)
    setError('')
    setSearched(true)
    const { users: u, works: w, error: err } = await searchSite(q)
    setUsers(u)
    setWorks(w)
    if (err) setError(err.message || 'Search failed')
    setLoading(false)
  }, [setParams])

  React.useEffect(() => {
    if (initial.trim()) runSearch(initial)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- initial load only

  const onSubmit = (e) => {
    e.preventDefault()
    runSearch(query)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground mb-6">
          Look up writers and shared works across the forums.
        </p>

        <form onSubmit={onSubmit} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users or titles…"
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Search'}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !searched ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Type a name or title to get started.
          </p>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="font-display text-xl font-semibold mb-4">
                Writers ({users.length})
              </h2>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No writers matched.</p>
              ) : (
                <ul className="space-y-3">
                  {users.map((u) => (
                    <li key={u.id}>
                      <Link
                        to={`/writers/${u.id}`}
                        className="block rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
                      >
                        <p className="font-semibold">{authorLabel(u)}</p>
                        {u.email && (
                          <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-4">
                Works ({works.length})
              </h2>
              {works.length === 0 ? (
                <p className="text-sm text-muted-foreground">No works matched.</p>
              ) : (
                <ul className="space-y-3">
                  {works.map((w) => (
                    <li key={w.id}>
                      <button
                        type="button"
                        className="w-full text-left rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
                        onClick={() => navigate(`/forum/post/${w.id}`)}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold">{w.title}</span>
                          {w.post_kind !== 'discussion' && <AiBadge status={w.ai_status} />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {authorLabel(w.profiles)}
                          {w.forum_boards?.name ? ` · ${w.forum_boards.name}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 font-document">
                          {plainPreview(w.body, 160)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
