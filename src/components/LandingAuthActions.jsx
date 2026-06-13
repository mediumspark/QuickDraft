import * as React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import AuthModal from '@/components/AuthModal'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingAuthActions({ size = 'lg', className = '' }) {
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
      await signInWithGoogle('/account')
    } catch {
      setAuthOpen(true)
      setGoogleLoading(false)
    }
  }

  if (user) {
    return (
      <div className={className}>
        <Link to="/account">
          <Button variant="outline" size={size} className="w-full sm:w-auto">
            My Account
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-3 justify-center ${className}`}>
      <GoogleSignInButton
        size={size}
        onClick={handleGoogleSignIn}
        loading={googleLoading}
        label="Continue with Google"
        className="w-full sm:w-auto"
      />
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        redirectPath="/account"
        isConfigured={isAuthConfigured}
      />
    </div>
  )
}
