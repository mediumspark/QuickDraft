import { FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'

const ACTION_COPY = {
  edit: {
    title: 'Pay to Edit',
    label: 'unlock editing for this agreement',
    after: ' Further edits on this device are free after payment. Sign in to sync purchases across devices.',
  },
  download: {
    title: 'Pay to Download',
    label: 'download this PDF',
    after: ' Re-downloading on this device is free after payment. Sign in to sync purchases across devices.',
  },
  share: {
    title: 'Pay to Share',
    label: 'share this agreement',
    after: ' Re-copying the share link on this device is free after payment. Sign in to sync purchases across devices.',
  },
}

export default function PayForDocumentModal({ open, onOpenChange, action = 'download', onPay, loading }) {
  const copy = ACTION_COPY[action] || ACTION_COPY.download

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {copy.title}
          </DialogTitle>
          <DialogDescription>
            Pay $5 once to {copy.label}. Drafting and reading the full agreement are always free.
            {copy.after}
          </DialogDescription>
        </DialogHeader>

        <LegalDisclaimer variant="banner" />

        <div className="rounded-lg border bg-muted/30 p-4 text-center my-2">
          <p className="text-3xl font-bold text-primary">$5</p>
          <p className="text-sm text-muted-foreground">per document action</p>
        </div>

        <Button onClick={onPay} disabled={loading} className="w-full">
          {loading ? <Spinner size="sm" /> : null}
          {loading ? 'Redirecting to checkout...' : 'Pay $5 & Continue'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
