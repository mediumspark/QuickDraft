import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, FileDown } from 'lucide-react'
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
import { addAuditEntry, loadFromStorage, DRAFT_KEY } from '@/utils/storageUtils'
import {
  getBoilerplateProduct,
  getBoilerplateAgreementData,
  getBoilerplateFilename,
} from '@/data/boilerplateProducts'
import { downloadAgreementDocx } from '@/utils/docxUtils'
import { downloadPdf } from '@/utils/pdfUtils'

const ACTION_LABELS = {
  download: 'download',
  share: 'share link',
  edit: 'editing unlock',
}

function parseBoilerplateId(documentId) {
  if (!documentId?.startsWith('boilerplate:')) return null
  return documentId.slice('boilerplate:'.length)
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = React.useState('loading') // loading | success | error
  const [action, setAction] = React.useState(null)
  const [documentId, setDocumentId] = React.useState(null)
  const [error, setError] = React.useState('')
  const [downloading, setDownloading] = React.useState(false)
  const [downloaded, setDownloaded] = React.useState(false)

  const boilerplateId = parseBoilerplateId(documentId)
  const boilerplateProduct = boilerplateId ? getBoilerplateProduct(boilerplateId) : null

  const deliverBoilerplate = React.useCallback(async (productId) => {
    const product = getBoilerplateProduct(productId)
    const agreementData = product ? getBoilerplateAgreementData(product) : null
    if (!product || !agreementData) {
      throw new Error('Purchased template not found')
    }
    await downloadAgreementDocx(agreementData, getBoilerplateFilename(product))
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function verify() {
      if (!sessionId) {
        setStatus('error')
        setError('Missing checkout session. If you were charged, check your email from Stripe or contact support with your receipt.')
        return
      }

      try {
        const result = await verifyDocumentPayment(sessionId)
        if (cancelled) return

        if (!result.paid) {
          setStatus('error')
          setError(result.error || 'Payment was not completed.')
          clearPendingPayment()
          return
        }

        markDocumentPaid(result.documentId, result.action)
        addAuditEntry('payment_purchase', `Paid for ${result.action}`, result.documentId)
        setAction(result.action)
        setDocumentId(result.documentId)
        setStatus('success')

        const pending = getPendingPayment() || {}
        const productId = parseBoilerplateId(result.documentId)

        if (productId) {
          setPendingPayment(result.documentId, result.action, {
            ...pending,
            returnType: 'boilerplate',
            productId,
          })
          try {
            setDownloading(true)
            await deliverBoilerplate(productId)
            if (!cancelled) setDownloaded(true)
          } catch {
            // User can retry with the download button below.
          } finally {
            if (!cancelled) setDownloading(false)
          }
          clearPendingPayment()
          return
        }

        // Builder purchase — finish download/share/edit in the builder.
        setPendingPayment(result.documentId, result.action, {
          withSignatures: pending.withSignatures ?? false,
        })

        if (result.action === 'download') {
          // Best-effort: download current local draft immediately, then send them to builder.
          try {
            const draft = loadFromStorage(DRAFT_KEY)
            if (draft) {
              setDownloading(true)
              downloadPdf(draft, {})
              setDownloaded(true)
            }
          } catch {
            // Fall through to builder continue.
          } finally {
            if (!cancelled) setDownloading(false)
          }
        }

        // Auto-continue to builder so share/edit flows complete and unlock state syncs.
        if (result.action === 'share' || result.action === 'edit') {
          navigate(`/builder?payment=success&session_id=${encodeURIComponent(sessionId)}`, {
            replace: true,
          })
        }
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setError(err.message || 'Could not verify payment.')
      }
    }

    verify()
    return () => { cancelled = true }
  }, [sessionId, deliverBoilerplate, navigate])

  const handleDownloadAgain = async () => {
    if (!boilerplateId && action !== 'download') return
    setDownloading(true)
    try {
      if (boilerplateId) {
        await deliverBoilerplate(boilerplateId)
      } else {
        const draft = loadFromStorage(DRAFT_KEY)
        if (!draft) throw new Error('Draft not found on this device')
        downloadPdf(draft, {})
      }
      setDownloaded(true)
    } catch (err) {
      setError(err.message || 'Download failed. Try again.')
    } finally {
      setDownloading(false)
    }
  }

  const label = ACTION_LABELS[action] || 'purchase'
  const builderContinueUrl = `/builder?payment=success&session_id=${encodeURIComponent(sessionId || '')}`
  const boilerplateUrl = boilerplateId ? `/boilerplates/${boilerplateId}` : null

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-lg text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Spinner className="mx-auto" />
            <h1 className="text-2xl font-bold">Confirming your payment…</h1>
            <p className="text-muted-foreground">Preparing your document.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <div>
              <h1 className="text-3xl font-bold">Payment successful</h1>
              <p className="text-muted-foreground mt-2">
                {boilerplateProduct
                  ? downloaded
                    ? `Your ${boilerplateProduct.name} Word document should be downloading.`
                    : `Your ${boilerplateProduct.name} is unlocked. Download it below.`
                  : downloaded
                    ? 'Your PDF should be downloading. You can also reopen it from the builder anytime on this device.'
                    : `Your ${label} is unlocked.`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {(boilerplateId || action === 'download') && (
                <Button size="lg" onClick={handleDownloadAgain} disabled={downloading}>
                  {downloading ? <Spinner size="sm" /> : <FileDown className="h-4 w-4" />}
                  {downloading ? 'Preparing…' : downloaded ? 'Download again' : 'Download document'}
                </Button>
              )}
              {boilerplateUrl ? (
                <Link to={boilerplateUrl}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View product page
                  </Button>
                </Link>
              ) : (
                <Link to={builderContinueUrl}>
                  <Button size="lg" variant={action === 'download' ? 'outline' : 'default'} className="w-full sm:w-auto">
                    Continue to Builder
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <XCircle className="h-14 w-14 text-destructive mx-auto" />
            <div>
              <h1 className="text-3xl font-bold">Couldn’t confirm payment</h1>
              <p className="text-muted-foreground mt-2">{error}</p>
              <p className="text-sm text-muted-foreground mt-3">
                If Stripe charged you, keep your receipt and contact support — we can unlock your purchase.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/boilerplates">
                <Button size="lg" variant="outline">Word Templates</Button>
              </Link>
              <Link to="/builder">
                <Button size="lg">Builder</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">Contact</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
