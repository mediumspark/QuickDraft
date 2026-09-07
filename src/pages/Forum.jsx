import * as React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Spinner } from '@/components/ui/spinner'
import { listForumBoards } from '@/services/supabase'
import { COMMUNITY_BOARDS, GENRE_BOARDS } from '@/data/forumBoards'

function BoardGroup({ title, boards }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-semibold mb-4">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {boards.map((b) => (
          <li key={b.slug}>
            <Link
              to={`/forum/${b.slug}`}
              className="block h-full rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <h3 className="font-semibold">{b.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{b.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Forum() {
  const [boards, setBoards] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error: err } = await listForumBoards()
      if (cancelled) return
      if (err) setError(err.message || 'Could not load forums')
      setBoards(data?.length ? data : [...GENRE_BOARDS, ...COMMUNITY_BOARDS].map((b) => ({
        slug: b.slug,
        name: b.name,
        description: b.description,
        kind: b.kind,
        sort_order: b.sortOrder,
      })))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const genres = boards.filter((b) => b.kind === 'genre')
  const community = boards.filter((b) => b.kind === 'community')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Forum</h1>
        <p className="text-muted-foreground mb-8">
          Browse by genre to share writing, or join the community boards for advice, promotions, and talk.
          Comments require a signed-in account.
        </p>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <p className="text-destructive text-sm mb-6">{error}</p>
        ) : null}

        {!loading && (
          <>
            <BoardGroup title="Writing genres" boards={genres} />
            <BoardGroup title="Community" boards={community} />
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
