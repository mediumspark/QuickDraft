import * as React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  verifyDocumentPayment,
  markDocumentPaid,
  getPendingPayment,
  setPendingPayment,
  clearPendingPayment,
} from '@/services/payments'
import { addAuditEntry } from '@/utils/storageUtils'

const ACTION_LABELS = {
  download: 'PDF download',
  share: 'share link',
  edit: 'editing unlock',
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = React.useState('loading') // loading | success | error
  const [action, setAction] = React.useState(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let cancelled = false

    async function verify() {
      if (!sessionId) {
        setStatus('error')
        setError('Missing checkout session. If you were charged, open the Builder — your purchase may already be recorded.')
        return
      }

      try {
        const result = await verifyDocumentPayment(sessionId)
        if (cancelled) return

        if (result.paid) {
          markDocumentPaid(result.documentId, result.action)
          addAuditEntry('payment_purchase', `Paid for ${result.action}`, result.documentId)
          setAction(result.action)
          setStatus('success')

          // Keep pending payment so Builder can finish download/share after return.
          const pending = getPendingPayment()
          setPendingPayment(result.documentId, result.action, {
            withSignatures: pending?.withSignatures ?? false,
          })
        } else {
          setStatus('error')
          setError(result.error || 'Payment was not completed.')
          clearPendingPayment()
        }
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setError(err.message || 'Could not verify payment.')
      }
    }

    verify()
    return () => { cancelled = true }
  }, [sessionId])

  const label = ACTION_LABELS[action] || 'purchase'
  const builderContinueUrl = `/builder?payment=success&session_id=${encodeURIComponent(sessionId || '')}`

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-lg text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Spinner className="mx-auto" />
            <h1 className="text-2xl font-bold">Confirming your payment…</h1>
            <p className="text-muted-foreground">Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <div>
              <h1 className="text-3xl font-bold">Payment successful</h1>
              <p className="text-muted-foreground mt-2">
                Your {label} is unlocked. Return to the builder to finish.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={builderContinueUrl}>
                <Button size="lg" className="w-full sm:w-auto">Continue to Builder</Button>
              </Link>
              <Link to="/account">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">View Account</Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <XCircle className="h-14 w-14 text-destructive mx-auto" />
            <div>
              <h1 className="text-3xl font-bold">Couldn’t confirm payment</h1>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/builder">
                <Button size="lg">Back to Builder</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">Contact Support</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
