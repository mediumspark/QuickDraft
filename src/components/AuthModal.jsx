import * as React from 'react'
import { LogIn, AlertCircle, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseConfigStatus } from '@/utils/supabaseConfig'

function SetupInstructions() {
  const { issues, steps } = getSupabaseConfigStatus()

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 flex gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Supabase is not configured yet</p>
          {issues.length > 0 && (
            <ul className="mt-1 list-disc list-inside text-amber-800">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <p className="font-medium mb-2">Setup steps:</p>
        <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs space-y-1">
        <p className="text-muted-foreground font-sans text-sm mb-2">Your .env should look like:</p>
        <p>VITE_SUPABASE_URL=https://abcdefgh.supabase.co</p>
        <p>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
      </div>

      <a
        href="https://supabase.com/dashboard/project/_/auth/providers?provider=Google"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        Open Supabase Google provider settings
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}

export default function AuthModal({ open, onOpenChange, redirectPath = '/account', isConfigured }) {
  const { signInWithGoogle, isAuthConfigured: authConfiguredFromContext } = useAuth()
  const isAuthConfigured = isConfigured ?? authConfiguredFromContext
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleOpenChange = (next) => {
    if (!next) {
      setError('')
    }
    onOpenChange(next)
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle(redirectPath)
    } catch (err) {
      setError(err.message || 'Could not start Google sign in')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" />
            Sign in with Google
          </DialogTitle>
          <DialogDescription>
            Use your Google account to save drafts and sync purchases across devices.
            Drafting and agreement previews stay free.
          </DialogDescription>
        </DialogHeader>

        {!isAuthConfigured ? (
          <SetupInstructions />
        ) : (
          <div className="space-y-4">
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              loading={loading}
              label="Continue with Google"
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {loading && (
              <p className="text-sm text-muted-foreground text-center">
                Redirecting to Google...
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
