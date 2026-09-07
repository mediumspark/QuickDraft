import * as React from 'react'
import { Link } from 'react-router-dom'
import { PenLine, Trash2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AiBadge from '@/components/AiBadge'
import { plainPreview } from '@/utils/richText'
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { listDrafts, deleteDraft } from '@/services/supabase'

export default function Drafts() {
  const { user, loading: authLoading, isAuthConfigured } = useAuth()
  const { addToast } = useToast()
  const [drafts, setDrafts] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [authOpen, setAuthOpen] = React.useState(false)

  const refresh = React.useCallback(async () => {
    if (!user) {
      setDrafts([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await listDrafts()
    if (error) addToast('Could not load drafts', 'error')
    setDrafts(data || [])
    setLoading(false)
  }, [user, addToast])

  React.useEffect(() => {
    if (!authLoading) refresh()
  }, [authLoading, refresh])

  const handleDelete = async (id) => {
    if (!confirm('Delete this draft?')) return
    const { error } = await deleteDraft(id)
    if (error) {
      addToast('Delete failed', 'error')
      return
    }
    addToast('Draft deleted')
    refresh()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My drafts</h1>
          <Link to="/write">
            <Button>
              <PenLine className="h-4 w-4 mr-1" />
              New draft
            </Button>
          </Link>
        </div>

        {!user && !authLoading ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to sync and manage cloud drafts.</p>
            <Button onClick={() => setAuthOpen(true)}>Sign in with Google</Button>
          </div>
        ) : loading || authLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : drafts.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No drafts yet. Start writing.</p>
        ) : (
          <ul className="space-y-3">
            {drafts.map((d) => (
              <li key={d.id} className="rounded-lg border bg-card p-4 flex items-start justify-between gap-3">
                <Link to={`/write/${d.id}`} className="min-w-0 flex-1 hover:opacity-80">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold truncate">{d.title || 'Untitled'}</h2>
                    <AiBadge status={d.ai_status} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {plainPreview(d.body, 160) || 'Empty draft'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {d.word_count || 0} words · updated {new Date(d.updated_at).toLocaleString()}
                  </p>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath="/drafts" isConfigured={isAuthConfigured} />
    </div>
  )
}
