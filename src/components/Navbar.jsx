import * as React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { User, PenLine, Moon, Sun, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AuthModal from '@/components/AuthModal'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { countUnreadNotifications } from '@/services/supabase'
import { cn } from '@/lib/utils'

const links = [
  { to: '/write', label: 'Write' },
  { to: '/drafts', label: 'Drafts' },
  { to: '/forum', label: 'Forum' },
  { to: '/about', label: 'About' },
]

export default function Navbar({ transparent = false }) {
  const { user, loading, signInWithGoogle, isAuthConfigured } = useAuth()
  const { resolved, toggleTheme } = useTheme()
  const [authOpen, setAuthOpen] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [unread, setUnread] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    if (!user) {
      setUnread(0)
      return undefined
    }
    ;(async () => {
      const { count } = await countUnreadNotifications()
      if (!cancelled) setUnread(count || 0)
    })()
    const timer = setInterval(async () => {
      const { count } = await countUnreadNotifications()
      if (!cancelled) setUnread(count || 0)
    }, 60000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [user])

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
    <header
      className={cn(
        'z-40 w-full',
        transparent
          ? 'absolute top-0 left-0 right-0 border-transparent bg-transparent'
          : 'sticky top-0 border-b bg-background/90 backdrop-blur-md'
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary transition-transform group-hover:scale-[1.03]">
            <span className="text-primary-foreground font-bold text-[10px] tracking-wide">AQD</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">AQuickDraft</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(transparent && 'bg-card/40 backdrop-blur-sm')}
          >
            {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user && (
            <Link to="/updates" className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Updates"
                aria-label="Updates"
                className={cn(transparent && 'bg-card/40 backdrop-blur-sm')}
              >
                <Bell className="h-4 w-4" />
              </Button>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )}
          {!loading && (
            user ? (
              <Link to="/account">
                <Button variant="outline" size="sm" className={cn(transparent && 'bg-card/60 backdrop-blur-sm')}>
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
                className={cn('w-auto', transparent && 'bg-card/60 backdrop-blur-sm')}
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
