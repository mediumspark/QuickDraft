import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, Share2 } from 'lucide-react'
import { BuilderNavbar } from '@/components/Navbar'
import AgreementTypeSelector from '@/components/clauses/AgreementTypeSelector'
import PartiesClause from '@/components/clauses/PartiesClause'
import FinancialTermsClause from '@/components/clauses/FinancialTermsClause'
import DurationClause from '@/components/clauses/DurationClause'
import DisputeClause from '@/components/clauses/DisputeClause'
import CustomClausesClause from '@/components/clauses/CustomClausesClause'
import AgreementPreview from '@/components/AgreementPreview'
import AgreementNotes from '@/components/AgreementNotes'
import TemplateLibrary from '@/components/TemplateLibrary'
import VersionHistory from '@/components/VersionHistory'
import AuditLogPanel from '@/components/AuditLogPanel'
import EmailNotifyModal from '@/components/EmailNotifyModal'
import PayForDocumentModal from '@/components/PayForDocumentModal'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import {
  createEmptyDraft, DRAFT_KEY, loadFromStorage, saveToStorage, addAuditEntry,
} from '@/utils/storageUtils'
import { getOrCreateSessionId } from '@/utils/agreementUtils'
import { downloadPdf } from '@/utils/pdfUtils'
import { sendSignatureEmails } from '@/utils/emailUtils'
import { saveDraftToBackend, enableSharing } from '@/services/supabase'
import {
  isPaymentsConfigured,
  isDocumentPaid,
  markDocumentPaid,
  ensureDocumentAccess,
  verifyDocumentPayment,
  getPendingPayment,
  clearPendingPayment,
  setPendingPayment,
} from '@/services/payments'

export default function Builder() {
  const { addToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [draft, setDraft] = React.useState(() => {
    const saved = loadFromStorage(DRAFT_KEY)
    return saved || { ...createEmptyDraft(), sessionId: getOrCreateSessionId() }
  })
  const [signatures, setSignatures] = React.useState({})
  const [savedId, setSavedId] = React.useState(draft.id)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [paying, setPaying] = React.useState(false)
  const [sharing, setSharing] = React.useState(false)
  const [templatesOpen, setTemplatesOpen] = React.useState(false)
  const [versionsOpen, setVersionsOpen] = React.useState(false)
  const [auditOpen, setAuditOpen] = React.useState(false)
  const [emailModalOpen, setEmailModalOpen] = React.useState(false)
  const [payModalOpen, setPayModalOpen] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState('download')
  const [pendingWithSignatures, setPendingWithSignatures] = React.useState(false)

  React.useEffect(() => {
    if (!draft.sessionId) {
      setDraft((d) => ({ ...d, sessionId: getOrCreateSessionId() }))
    }
  }, [draft.sessionId])

  React.useEffect(() => {
    saveToStorage(DRAFT_KEY, draft)
  }, [draft])

  const updateDraft = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const getDocumentId = React.useCallback(() => {
    return draft.id || draft.sessionId || getOrCreateSessionId()
  }, [draft.id, draft.sessionId])

  const executeDownload = React.useCallback(async (withSignatures = false) => {
    const sigs = withSignatures ? signatures : {}
    downloadPdf(draft, sigs)
    addAuditEntry('pdf_download', 'PDF downloaded', withSignatures ? 'With signatures' : 'Unsigned')
    addToast('PDF downloaded successfully')

    if (withSignatures && Object.keys(signatures).length) {
      const { sent, total } = await sendSignatureEmails(draft, signatures)
      if (total > 0) {
        addToast(`Signature notifications sent to ${sent}/${total} emails`)
      }
    }

    setEmailModalOpen(true)
  }, [draft, signatures, addToast])

  const executeShare = React.useCallback(async () => {
    let current = draft
    if (!current.id) {
      const { data } = await saveDraftToBackend(current)
      current = { ...current, id: data?.id || getDocumentId() }
      setDraft((d) => ({ ...d, id: current.id }))
    }
    const shared = await enableSharing(current)
    setDraft((d) => ({ ...d, shareToken: shared.shareToken, isShared: true, id: shared.id }))
    const url = `${window.location.origin}/view/${shared.id}?token=${shared.shareToken}`
    await navigator.clipboard.writeText(url)
    addToast('Share link copied to clipboard')
  }, [draft, getDocumentId, addToast])

  React.useEffect(() => {
    async function handlePaymentReturn() {
      const payment = searchParams.get('payment')
      const sessionId = searchParams.get('session_id')

      if (payment === 'cancelled') {
        addToast('Payment cancelled.', 'info')
        clearPendingPayment()
        searchParams.delete('payment')
        setSearchParams(searchParams, { replace: true })
        return
      }

      if (payment !== 'success' || !sessionId) return

      setPaying(true)
      try {
        const result = await verifyDocumentPayment(sessionId)
        if (result.paid) {
          markDocumentPaid(result.documentId, result.action)
          addAuditEntry('payment_purchase', `Paid for ${result.action}`, result.documentId)
          addToast('Payment successful!')

          const pending = getPendingPayment()
          if (result.action === 'download') {
            await executeDownload(pending?.withSignatures ?? false)
          } else if (result.action === 'share') {
            await executeShare()
          }
        }
      } catch {
        addToast('Could not verify payment. Please try again.', 'error')
      } finally {
        clearPendingPayment()
        setPaying(false)
        searchParams.delete('payment')
        searchParams.delete('session_id')
        setSearchParams(searchParams, { replace: true })
      }
    }

    handlePaymentReturn()
  }, [searchParams, setSearchParams, addToast, executeDownload, executeShare])

  const gateAction = async (action, withSignatures = false) => {
    const documentId = getDocumentId()

    if (!isPaymentsConfigured()) {
      return true
    }

    if (isDocumentPaid(documentId, action)) {
      return true
    }

    setPendingAction(action)
    setPendingWithSignatures(withSignatures)
    setPayModalOpen(true)
    return false
  }

  const handlePayAndContinue = async () => {
    setPaying(true)
    try {
      const documentId = getDocumentId()
      setPendingPayment(documentId, pendingAction, { withSignatures: pendingWithSignatures })
      const result = await ensureDocumentAccess(documentId, pendingAction)
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      }
    } catch (err) {
      addToast(err.message || 'Failed to start checkout', 'error')
    } finally {
      setPaying(false)
      setPayModalOpen(false)
    }
  }

  const handleTypeChange = (type) => {
    updateDraft({ type })
    addAuditEntry('type_change', 'Agreement type changed', type)
  }

  const handlePartiesChange = (parties) => {
    updateDraft({ parties })
    addAuditEntry('party_edit', 'Party details updated')
  }

  const handleFinancialChange = (financial) => {
    updateDraft({ financial })
    addAuditEntry('financial_change', 'Financial terms updated')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data, error, offline } = await saveDraftToBackend(draft)
      if (error) throw error
      const id = data?.id || draft.id
      if (id) {
        setSavedId(id)
        updateDraft({ id })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      addToast(offline ? 'Saved locally (backend not configured)' : 'Draft saved to cloud')
    } catch {
      addToast('Failed to save draft', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (withSignatures = false) => {
    setDownloading(true)
    try {
      const allowed = await gateAction('download', withSignatures)
      if (!allowed) return
      await executeDownload(withSignatures)
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const allowed = await gateAction('share')
      if (!allowed) return
      await executeShare()
    } catch {
      addToast('Failed to create share link', 'error')
    } finally {
      setSharing(false)
    }
  }

  const loadTemplate = (data) => {
    setDraft({ ...data, sessionId: draft.sessionId, id: savedId })
    addAuditEntry('type_change', 'Template loaded', data.type)
    addToast('Template loaded')
  }

  const restoreVersion = (data) => {
    setDraft({ ...data, sessionId: draft.sessionId })
    addToast('Version restored')
  }

  const documentId = getDocumentId()
  const previewUnlocked =
    !isPaymentsConfigured() ||
    isDocumentPaid(documentId, 'download') ||
    isDocumentPaid(documentId, 'share')
  const signaturesUnlocked =
    !isPaymentsConfigured() || isDocumentPaid(documentId, 'download')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BuilderNavbar
        onTemplates={() => setTemplatesOpen(true)}
        onVersionHistory={() => setVersionsOpen(true)}
        onSave={handleSave}
        onSignDownload={() => handleDownload(true)}
        onDownload={() => handleDownload(false)}
        saving={saving}
        saved={saved}
        downloading={downloading || paying}
      />

      {isPaymentsConfigured() && (
        <div className="bg-accent border-b px-4 py-2 text-sm text-center text-accent-foreground">
          Drafting is free. Pay $5 per document to download or share — no account required.
        </div>
      )}

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4 min-w-0">
            <AgreementNotes />

            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-semibold mb-3">Agreement Type</h2>
              <AgreementTypeSelector value={draft.type} onChange={handleTypeChange} />
            </div>

            <PartiesClause
              parties={draft.parties}
              onChange={handlePartiesChange}
              onChangeAdditional={(additional) =>
                handlePartiesChange({ ...draft.parties, additional })
              }
            />

            <FinancialTermsClause
              type={draft.type}
              financial={draft.financial}
              parties={draft.parties}
              onChange={handleFinancialChange}
            />

            <DurationClause
              duration={draft.duration}
              onChange={(duration) => updateDraft({ duration })}
            />

            <DisputeClause
              dispute={draft.dispute}
              onChange={(dispute) => updateDraft({ dispute })}
            />

            <CustomClausesClause
              clauses={draft.customClauses}
              onChange={(customClauses) => updateDraft({ customClauses })}
            />

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)}>
                Templates
              </Button>
              <Button variant="outline" size="sm" onClick={() => setVersionsOpen(true)}>
                Version History
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)}>
                Audit Log
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} disabled={sharing || paying}>
                {sharing ? <Spinner size="sm" /> : <Share2 className="h-4 w-4" />}
                Share Link ($5)
              </Button>
            </div>
          </div>

          <div className="hidden lg:block lg:w-[45%] xl:w-[40%]">
            <div className="sticky top-20">
              <AgreementPreview
                agreement={draft}
                signatures={signatures}
                onSignaturesChange={setSignatures}
                unlocked={previewUnlocked}
                signaturesUnlocked={signaturesUnlocked}
              />
            </div>
          </div>
        </div>
      </div>

      <details className="lg:hidden fixed bottom-4 right-4 left-4 z-30">
        <summary className="flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg cursor-pointer list-none font-medium">
          <ChevronDown className="h-4 w-4" />
          Preview Document
        </summary>
        <div className="mt-2 max-h-[70vh] overflow-y-auto rounded-lg shadow-xl">
          <AgreementPreview
            agreement={draft}
            signatures={signatures}
            onSignaturesChange={setSignatures}
            unlocked={previewUnlocked}
            signaturesUnlocked={signaturesUnlocked}
          />
        </div>
      </details>

      <TemplateLibrary open={templatesOpen} onOpenChange={setTemplatesOpen} onSelect={loadTemplate} />
      <VersionHistory open={versionsOpen} onOpenChange={setVersionsOpen} draft={draft} onRestore={restoreVersion} />
      <AuditLogPanel open={auditOpen} onOpenChange={setAuditOpen} />
      <EmailNotifyModal open={emailModalOpen} onOpenChange={setEmailModalOpen} draft={draft} />
      <PayForDocumentModal
        open={payModalOpen}
        onOpenChange={setPayModalOpen}
        action={pendingAction}
        onPay={handlePayAndContinue}
        loading={paying}
      />
    </div>
  )
}
