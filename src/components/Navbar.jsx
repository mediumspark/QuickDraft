import * as React from 'react'
import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AuthModal from '@/components/AuthModal'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useAuth } from '@/contexts/AuthContext'

function AuthButtons({ size = 'default' }) {
  const { user, loading, signInWithGoogle, isAuthConfigured } = useAuth()
  const [authOpen, setAuthOpen] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)

  const handleGoogleSignIn = async () => {
    if (!isAuthConfigured) {
      setAuthOpen(true)
      return
    }
    setGoogleLoading(true)
    try {
      await signInWithGoogle('/account')
    } catch {
      setAuthOpen(true)
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {!loading && (
          user ? (
            <Link to="/account">
              <Button variant="outline" size={size}>
                <User className="h-4 w-4 mr-2" />
                Account
              </Button>
            </Link>
          ) : (
            <GoogleSignInButton
              size={size}
              onClick={handleGoogleSignIn}
              loading={googleLoading}
              label={size === 'sm' ? 'Google' : 'Sign in with Google'}
              className="w-auto"
            />
          )
        )}
        <Link to="/builder">
          <Button size={size}>
            {size === 'sm' ? 'New Draft' : 'Start Drafting'}
          </Button>
        </Link>
      </div>
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        redirectPath="/account"
        isConfigured={isAuthConfigured}
      />
    </>
  )
}

export default function Navbar({ variant = 'landing' }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-primary-foreground font-bold text-xs">AQD</span>
          </div>
          <span className="font-semibold text-lg">AQuickDraft</span>
        </Link>

        {variant === 'landing' && (
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#agreements" className="text-muted-foreground hover:text-foreground transition-colors">Agreements</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <Link to="/guide" className="text-muted-foreground hover:text-foreground transition-colors">Guide</Link>
            <Link to="/boilerplates" className="text-muted-foreground hover:text-foreground transition-colors">Word Docs</Link>
            <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </nav>
        )}

        <AuthButtons size={variant === 'builder' ? 'sm' : 'default'} />
      </div>
    </header>
  )
}

export function BuilderNavbar({
  onTemplates, onVersionHistory, onSave, onSignDownload, onDownload,
  saving, saved, downloading,
}) {
  const { user, signInWithGoogle, isAuthConfigured } = useAuth()
  const [authOpen, setAuthOpen] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)

  const handleGoogleSignIn = async () => {
    if (!isAuthConfigured) {
      setAuthOpen(true)
      return
    }
    setGoogleLoading(true)
    try {
      await signInWithGoogle('/builder')
    } catch {
      setAuthOpen(true)
      setGoogleLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground shrink-0">
            ← Home
          </Link>
          <span className="text-muted-foreground hidden sm:inline">|</span>
          <span className="font-semibold truncate hidden sm:inline">Agreement Builder</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {user ? (
            <Link to="/account" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-1" />
                Account
              </Button>
            </Link>
          ) : (
            <GoogleSignInButton
              size="sm"
              onClick={handleGoogleSignIn}
              loading={googleLoading}
              label="Google"
              className="hidden sm:inline-flex w-auto"
            />
          )}
          <Button variant="ghost" size="sm" onClick={onTemplates} className="hidden sm:inline-flex">
            Templates
          </Button>
          <Button variant="ghost" size="sm" onClick={onVersionHistory} className="hidden sm:inline-flex">
            Version History
          </Button>
          <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
            {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" onClick={onSignDownload} disabled={downloading}>
            {downloading ? '...' : 'Sign & Download'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onDownload} disabled={downloading}>
            Download
          </Button>
        </div>
      </div>
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        redirectPath="/builder"
        isConfigured={isAuthConfigured}
      />
    </header>
  )
}
