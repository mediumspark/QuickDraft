import * as React from 'react'
import { Link } from 'react-router-dom'
import { FileText, CreditCard, LogOut } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AuthModal from '@/components/AuthModal'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { listUserAgreements, listUserPayments } from '@/services/supabase'
import { getAgreementTypeLabel } from '@/utils/agreementUtils'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function draftTitle(draft) {
  const partyA = draft?.parties?.partyA?.name
  const partyB = draft?.parties?.partyB?.name
  if (partyA && partyB) return `${partyA} & ${partyB}`
  if (partyA) return partyA
  return getAgreementTypeLabel(draft?.type || draft?.agreement_type)
}

export default function Account() {
  const { user, loading: authLoading, signOut, isAuthConfigured } = useAuth()
  const [authOpen, setAuthOpen] = React.useState(false)
  const [drafts, setDrafts] = React.useState([])
  const [payments, setPayments] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      const [draftsResult, paymentsResult] = await Promise.all([
        listUserAgreements(),
        listUserPayments(),
      ])
      setDrafts(draftsResult.data || [])
      setPayments(paymentsResult.data || [])
      setLoading(false)
    }

    load()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // ignore
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isAuthConfigured) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center max-w-lg">
          <h1 className="text-2xl font-bold mb-4">Account</h1>
          <p className="text-muted-foreground">
            Sign in requires Supabase to be configured. You can still draft agreements and see
            summary previews without an account.
          </p>
          <Link to="/builder" className="inline-block mt-6">
            <Button>Start Drafting</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center max-w-lg">
          <h1 className="text-2xl font-bold mb-4">Your Account</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with Google to save drafts across devices and access your purchase history.
            Drafting and summary previews remain free.
          </p>
          <Button onClick={() => setAuthOpen(true)}>Continue with Google</Button>
          <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath="/account" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Account</h1>
            <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                Saved Drafts
              </h2>

              {drafts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No saved drafts yet.{' '}
                    <Link to="/builder" className="text-primary hover:underline">
                      Start drafting
                    </Link>{' '}
                    and hit Save to store agreements in your account.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {drafts.map((row) => {
                    const draft = row.data || row
                    const type = draft.type || row.agreement_type
                    return (
                      <Card key={row.id}>
                        <CardContent className="flex items-center justify-between gap-4 py-4">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{draftTitle(draft)}</p>
                            <p className="text-sm text-muted-foreground">
                              {getAgreementTypeLabel(type)} · Updated {formatDate(row.updated_at)}
                            </p>
                          </div>
                          <Link to={`/builder?draft=${row.id}`}>
                            <Button size="sm" variant="outline">Open</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                Purchases
              </h2>

              {payments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No purchases yet. Pay $5 per document to download or share — summary previews
                    are always free before you buy.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <Card key={payment.id}>
                      <CardHeader className="py-4">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base font-medium">
                            {payment.action === 'download' ? 'PDF Download' : 'Share Link'}
                          </CardTitle>
                          <Badge variant="secondary">
                            ${(payment.amount_cents / 100).toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
