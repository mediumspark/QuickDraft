import * as React from 'react'
import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { getPromptOfTheDay, setPromptOfTheDay } from '@/services/supabase'

export default function Account() {
  const { user, isAdmin, loading, signOut, isAuthConfigured } = useAuth()
  const { addToast } = useToast()
  const [authOpen, setAuthOpen] = React.useState(false)
  const [prompt, setPrompt] = React.useState('')
  const [promptLoading, setPromptLoading] = React.useState(false)
  const [savingPrompt, setSavingPrompt] = React.useState(false)

  React.useEffect(() => {
    if (!isAdmin) return undefined
    let cancelled = false
    setPromptLoading(true)
    ;(async () => {
      const { data, error } = await getPromptOfTheDay()
      if (cancelled) return
      if (error) addToast(error.message || 'Could not load prompt', 'error')
      setPrompt(data?.body || '')
      setPromptLoading(false)
    })()
    return () => { cancelled = true }
  }, [isAdmin, addToast])

  const savePrompt = async () => {
    setSavingPrompt(true)
    try {
      const { error } = await setPromptOfTheDay(prompt)
      if (error) throw error
      addToast(prompt.trim() ? 'Prompt of the day updated' : 'Prompt cleared from the homepage')
    } catch (err) {
      addToast(err.message || 'Could not save prompt', 'error')
    } finally {
      setSavingPrompt(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-lg space-y-6">
        <h1 className="text-3xl font-bold">Account</h1>
        {user ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Signed in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {isAdmin && (
                  <p className="text-xs text-primary font-medium">Admin</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link to="/drafts">
                    <Button variant="outline">My drafts</Button>
                  </Link>
                  <Link to="/write">
                    <Button>Write</Button>
                  </Link>
                  <Button variant="ghost" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Prompt of the day</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This shows on the homepage under the headline. Leave blank to hide it.
                  </p>
                  {promptLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="potd">Prompt</Label>
                        <Textarea
                          id="potd"
                          rows={4}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Write today’s prompt…"
                        />
                      </div>
                      <Button onClick={savePrompt} disabled={savingPrompt}>
                        {savingPrompt ? <Spinner size="sm" /> : null}
                        Save to homepage
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sign in to save drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Use Google to sync drafts across devices and leave feedback on the forum.
              </p>
              <Button onClick={() => setAuthOpen(true)}>Sign in with Google</Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath="/account" isConfigured={isAuthConfigured} />
    </div>
  )
}
