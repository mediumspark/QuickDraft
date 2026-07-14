import * as React from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import AuthModal from '@/components/AuthModal'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const templateLinks = [
  { to: '/templates/revenue-sharing', label: 'Revenue Sharing' },
  { to: '/templates/profit-sharing', label: 'Profit Sharing' },
  { to: '/templates/commission', label: 'Commission' },
  { to: '/templates/nda', label: 'NDA' },
]

const learnLinks = [
  { to: '/guide', label: 'Guide' },
  { to: '/faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

function NavDropdown({ label, items }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 min-w-[12rem] pt-2"
        >
          <div className="rounded-md border bg-background py-1 shadow-md">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                className="block px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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
              label={size === 'sm' ? 'Sign in' : 'Sign in'}
              className="w-auto"
            />
          )
        )}
        <Link to="/builder">
          <Button size={size}>
            {size === 'sm' ? 'Draft' : 'Start Drafting'}
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

function MobileNav() {
  const [open, setOpen] = React.useState(false)
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

  const close = () => setOpen(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent open={open} onOpenChange={setOpen} side="right" className="max-w-xs">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Templates
              </p>
              <ul className="space-y-1">
                {templateLinks.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="block rounded-md px-2 py-2 text-sm hover:bg-accent"
                      onClick={close}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Product
              </p>
              <ul className="space-y-1">
                <li>
                  <Link to="/boilerplates" className="block rounded-md px-2 py-2 text-sm hover:bg-accent" onClick={close}>
                    Word Docs
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="block rounded-md px-2 py-2 text-sm hover:bg-accent" onClick={close}>
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/builder" className="block rounded-md px-2 py-2 text-sm hover:bg-accent" onClick={close}>
                    Builder
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Learn
              </p>
              <ul className="space-y-1">
                {learnLinks.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="block rounded-md px-2 py-2 text-sm hover:bg-accent"
                      onClick={close}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4 space-y-2">
              {!loading && (
                user ? (
                  <Link to="/account" onClick={close}>
                    <Button variant="outline" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                  </Link>
                ) : (
                  <GoogleSignInButton
                    onClick={handleGoogleSignIn}
                    loading={googleLoading}
                    label="Sign in"
                  />
                )
              )}
              <Link to="/builder" onClick={close}>
                <Button className="w-full">Start Drafting</Button>
              </Link>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        redirectPath="/account"
        isConfigured={isAuthConfigured}
      />
    </>
  )
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-primary-foreground font-bold text-xs">AQD</span>
          </div>
          <span className="font-semibold text-lg">AQuickDraft</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavDropdown label="Templates" items={templateLinks} />
          <Link to="/boilerplates" className="text-muted-foreground hover:text-foreground transition-colors">
            Word Docs
          </Link>
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <NavDropdown label="Learn" items={learnLinks} />
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <AuthButtons />
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

function BuilderMenu({ label, items }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5', open && 'rotate-180')} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 min-w-[11rem] pt-1">
          <div className="rounded-md border bg-background py-1 shadow-md">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className="flex w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => {
                  setOpen(false)
                  item.onClick?.()
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
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

        <div className="flex items-center gap-1 shrink-0">
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
              label="Sign in"
              className="hidden sm:inline-flex w-auto"
            />
          )}

          <div className="hidden sm:block">
            <BuilderMenu
              label="Tools"
              items={[
                { label: 'Templates', onClick: onTemplates },
                { label: 'Version History', onClick: onVersionHistory },
              ]}
            />
          </div>

          <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
            {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
          </Button>

          <BuilderMenu
            label={downloading ? '...' : 'Download'}
            items={[
              { label: 'Download PDF', onClick: onDownload },
              { label: 'Sign & Download', onClick: onSignDownload },
            ]}
          />
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
