import * as React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { User, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AuthModal from '@/components/AuthModal'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const links = [
  { to: '/write', label: 'Write' },
  { to: '/drafts', label: 'Drafts' },
  { to: '/forum', label: 'Forum' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
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
      await signInWithGoogle('/drafts')
    } catch {
      setAuthOpen(true)
      setGoogleLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-primary-foreground font-bold text-xs">AQD</span>
          </div>
          <span className="font-semibold text-lg">AQuickDraft</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'text-muted-foreground hover:text-foreground transition-colors',
                  isActive && 'text-foreground font-medium'
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && (
            user ? (
              <Link to="/account">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  Account
                </Button>
              </Link>
            ) : (
              <GoogleSignInButton
                size="sm"
                onClick={handleGoogleSignIn}
                loading={googleLoading}
                label="Sign in"
                className="w-auto"
              />
            )
          )}
          <Link to="/write">
            <Button size="sm">
              <PenLine className="h-4 w-4 mr-1" />
              Write
            </Button>
          </Link>
        </div>
      </div>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath="/drafts" isConfigured={isAuthConfigured} />
    </header>
  )
}
