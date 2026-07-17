import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, Share2, Unlock } from 'lucide-react'
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
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import {
  createEmptyDraft, DRAFT_KEY, loadFromStorage, saveToStorage, addAuditEntry,
} from '@/utils/storageUtils'
import { getOrCreateSessionId } from '@/utils/agreementUtils'
import { downloadPdf } from '@/utils/pdfUtils'
import { sendSignatureEmails } from '@/utils/emailUtils'
import { saveDraftToBackend, enableSharing, loadUserDraftById } from '@/services/supabase'
import {
  isPaymentsConfigured,
  isDocumentPaid,
  canEditDocument,
  markDocumentPaid,
  ensureDocumentAccess,
  verifyDocumentPayment,
  getPendingPayment,
  clearPendingPayment,
  setPendingPayment,
  syncUserPaidDocuments,
} from '@/services/payments'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrentPrice } from '@/data/pricing'

export default function Builder() {
  const { addToast } = useToast()
  const { user } = useAuth()
  const price = formatCurrentPrice()
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
  // Saved drafts opened from account start view-only until edit is unlocked.
  const [editLocked, setEditLocked] = React.useState(false)

  React.useEffect(() => {
    if (!draft.sessionId) {
      setDraft((d) => ({ ...d, sessionId: getOrCreateSessionId() }))
    }
  }, [draft.sessionId])

  React.useEffect(() => {
    saveToStorage(DRAFT_KEY, draft)
  }, [draft])

  React.useEffect(() => {
    if (user) {
      syncUserPaidDocuments()
    }
  }, [user])

  const draftId = searchParams.get('draft')

  React.useEffect(() => {
    if (!draftId || !user) return

    let cancelled = false

    async function loadDraft() {
      const { data, error } = await loadUserDraftById(draftId)
      if (cancelled) return
      if (error || !data) {
        addToast('Could not load draft', 'error')
        return
      }
      setDraft(data)
      setSavedId(data.id)
      const docId = data.id || data.sessionId
      const unlocked =
        !isPaymentsConfigured() || canEditDocument(docId)
      setEditLocked(!unlocked)
      addToast(unlocked ? 'Draft loaded from your account' : `Draft loaded — viewing is free. Pay ${price} to edit.`)
      const next = new URLSearchParams(searchParams)
      next.delete('draft')
      setSearchParams(next, { replace: true })
    }

    loadDraft()
    return () => { cancelled = true }
  }, [draftId, user])

  const updateDraft = (patch) => {
    if (editLocked) return
    setDraft((d) => ({ ...d, ...patch }))
  }

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
          setEditLocked(false)

          const pending = getPendingPayment()
          if (result.action === 'download') {
            await executeDownload(pending?.withSignatures ?? false)
          } else if (result.action === 'share') {
            await executeShare()
          } else if (result.action === 'edit') {
            addToast('Editing unlocked for this agreement')
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
    if (editLocked) {
      addToast(`Pay ${price} to unlock editing before saving changes.`, 'info')
      setPendingAction('edit')
      setPayModalOpen(true)
      return
    }
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

  const handleUnlockEdit = async () => {
    const allowed = await gateAction('edit')
    if (allowed) {
      setEditLocked(false)
    }
  }

  const loadTemplate = (data) => {
    if (editLocked) {
      addToast(`Pay ${price} to unlock editing before loading a template.`, 'info')
      setPendingAction('edit')
      setPayModalOpen(true)
      return
    }
    setDraft({ ...data, sessionId: draft.sessionId, id: savedId })
    addAuditEntry('type_change', 'Template loaded', data.type)
    addToast('Template loaded')
  }

  const restoreVersion = (data) => {
    if (editLocked) {
      addToast(`Pay ${price} to unlock editing before restoring a version.`, 'info')
      setPendingAction('edit')
      setPayModalOpen(true)
      return
    }
    setDraft({ ...data, sessionId: draft.sessionId })
    addToast('Version restored')
  }

  const documentId = getDocumentId()
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

      <div className="bg-accent border-b px-4 py-2 text-sm text-center text-accent-foreground">
        {isPaymentsConfigured()
          ? `Drafting and reading are free. Pay ${price} to edit a saved draft, download, or share.`
          : 'Agreement templates for game devs, technical folks & students — not lawyer-drafted documents.'}
        {isPaymentsConfigured() && (user ? ' Your purchases sync to your account.' : ' Sign in to save drafts across devices.')}
      </div>

      <div className="border-b px-4 py-2">
        <LegalDisclaimer variant="compact" className="text-center" />
      </div>

      {editLocked && (
        <div className="border-b bg-amber-50 px-4 py-3 text-sm text-amber-950 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span>
            Viewing is free. This saved draft is locked — pay {price} to unlock editing.
          </span>
          <Button size="sm" onClick={handleUnlockEdit} disabled={paying}>
            {paying ? <Spinner size="sm" /> : <Unlock className="h-4 w-4" />}
            Unlock Editing ({price})
          </Button>
        </div>
      )}

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4 min-w-0">
            <div className={editLocked ? 'pointer-events-none opacity-60 select-none space-y-4' : 'space-y-4'}>
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
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)} disabled={editLocked}>
                Templates
              </Button>
              <Button variant="outline" size="sm" onClick={() => setVersionsOpen(true)}>
                Version History
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)}>
                Audit Log
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={sharing || paying}
              >
                {sharing ? <Spinner size="sm" /> : <Share2 className="h-4 w-4" />}
                Share Link ({price})
              </Button>
            </div>
          </div>

          <div className="hidden lg:block lg:w-[45%] xl:w-[40%]">
            <div className="sticky top-20">
              <AgreementPreview
                agreement={draft}
                signatures={signatures}
                onSignaturesChange={editLocked ? undefined : setSignatures}
                signaturesUnlocked={signaturesUnlocked && !editLocked}
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
            onSignaturesChange={editLocked ? undefined : setSignatures}
            signaturesUnlocked={signaturesUnlocked && !editLocked}
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
