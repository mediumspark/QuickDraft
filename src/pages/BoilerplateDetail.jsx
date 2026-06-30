import * as React from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FileDown, Check } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import PayForBoilerplateModal from '@/components/PayForBoilerplateModal'
import { useToast } from '@/components/ui/toast'
import {
  getBoilerplateProduct,
  getBoilerplateAgreementData,
  getBoilerplateDocumentId,
  getBoilerplateFilename,
  BOILERPLATE_PRICE_CENTS,
} from '@/data/boilerplateProducts'
import { downloadAgreementDocx } from '@/utils/docxUtils'
import {
  isPaymentsConfigured,
  isDocumentPaid,
  markDocumentPaid,
  ensureDocumentAccess,
  verifyDocumentPayment,
  clearPendingPayment,
  setPendingPayment,
} from '@/services/payments'

export default function BoilerplateDetail() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToast } = useToast()

  const product = getBoilerplateProduct(slug)
  const agreementData = product ? getBoilerplateAgreementData(product) : null
  const documentId = product ? getBoilerplateDocumentId(product.id) : null

  const [payModalOpen, setPayModalOpen] = React.useState(false)
  const [paying, setPaying] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [paid, setPaid] = React.useState(() =>
    documentId ? isDocumentPaid(documentId, 'download') : false
  )

  const priceLabel = `$${BOILERPLATE_PRICE_CENTS / 100}`

  const executeDownload = React.useCallback(async () => {
    if (!product || !agreementData) return
    setDownloading(true)
    try {
      await downloadAgreementDocx(agreementData, getBoilerplateFilename(product))
      addToast('Word document downloaded')
    } catch {
      addToast('Failed to generate Word document', 'error')
    } finally {
      setDownloading(false)
    }
  }, [product, agreementData, addToast])

  React.useEffect(() => {
    if (!documentId) return
    setPaid(isDocumentPaid(documentId, 'download'))
  }, [documentId])

  React.useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (paymentStatus === 'cancelled') {
      clearPendingPayment()
      setSearchParams({}, { replace: true })
      addToast('Payment cancelled', 'error')
      return
    }

    if (paymentStatus !== 'success' || !sessionId || !documentId) return

    let cancelled = false

    ;(async () => {
      try {
        const result = await verifyDocumentPayment(sessionId)
        if (cancelled) return

        if (result.paid) {
          markDocumentPaid(documentId, 'download')
          setPaid(true)
          clearPendingPayment()
          setSearchParams({}, { replace: true })
          addToast('Payment successful')
          await executeDownload()
        }
      } catch {
        if (!cancelled) addToast('Payment verification failed', 'error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, documentId, setSearchParams, addToast, executeDownload])

  if (!product || !agreementData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Boilerplate not found</h1>
          <Link to="/boilerplates">
            <Button variant="outline">Back to boilerplates</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const unlocked = !isPaymentsConfigured() || paid

  const handleDownloadClick = async () => {
    if (unlocked) {
      await executeDownload()
      return
    }
    setPayModalOpen(true)
  }

  const handlePayAndContinue = async () => {
    setPaying(true)
    try {
      setPendingPayment(documentId, 'download', { returnType: 'boilerplate', productId: product.id })
      const result = await ensureDocumentAccess(documentId, 'download', {
        successPath: `/boilerplates/${product.id}`,
        cancelPath: `/boilerplates/${product.id}`,
        productLabel: `${product.name} (Word)`,
      })
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      }
    } catch {
      addToast('Failed to start checkout', 'error')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <Link to="/boilerplates" className="text-sm text-muted-foreground hover:text-foreground">
          ← All boilerplates
        </Link>

        <h1 className="text-4xl font-bold mt-4 mb-2">{product.name}</h1>
        <p className="text-lg text-muted-foreground mb-6">{product.description}</p>

        <LegalDisclaimer variant="banner" className="mb-8" />

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">What&apos;s included</h2>
          <ul className="space-y-2">
            {product.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-primary">{priceLabel}</p>
              <p className="text-sm text-muted-foreground">One-time · editable Word document</p>
              {paid && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Purchased — re-download anytime on this device
                </p>
              )}
            </div>
            <Button size="lg" onClick={handleDownloadClick} disabled={downloading || paying}>
              {downloading || paying ? (
                <Spinner size="sm" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              {unlocked ? 'Download Word Doc' : `Buy & Download — ${priceLabel}`}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Opens in Microsoft Word, Google Docs, or LibreOffice. Replace placeholder names and
            review every clause before use.
          </p>
        </section>

        <section className="rounded-lg border bg-muted/30 p-5">
          <p className="font-medium mb-2">Prefer to customize online?</p>
          <p className="text-sm text-muted-foreground mb-4">
            Load a similar template in the builder, edit parties and clauses, then export as PDF.
          </p>
          <Link to="/builder">
            <Button variant="outline">Open Agreement Builder</Button>
          </Link>
        </section>
      </main>
      <Footer />

      <PayForBoilerplateModal
        open={payModalOpen}
        onOpenChange={setPayModalOpen}
        productName={product.name}
        onPay={handlePayAndContinue}
        loading={paying}
      />
    </div>
  )
}
