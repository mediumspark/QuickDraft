import * as React from 'react'
import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'

export default function Account() {
  const { user, loading, signOut, isAuthConfigured } = useAuth()
  const [authOpen, setAuthOpen] = React.useState(false)

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
      <main className="flex-1 container mx-auto px-4 py-16 max-w-lg">
        <h1 className="text-3xl font-bold mb-6">Account</h1>
        {user ? (
          <Card>
            <CardHeader>
              <CardTitle>Signed in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{user.email}</p>
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
