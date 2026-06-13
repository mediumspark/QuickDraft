import { FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export default function PayForDocumentModal({ open, onOpenChange, action = 'download', onPay, loading }) {
  const actionLabel = action === 'share' ? 'share this agreement' : 'download this PDF'
  const title = action === 'share' ? 'Pay to Share' : 'Pay to Download'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Pay $5 once to {actionLabel}. No account needed. Re-downloading or re-copying the
            same link on this device is free after payment.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 text-center my-2">
          <p className="text-3xl font-bold text-primary">$5</p>
          <p className="text-sm text-muted-foreground">per document</p>
        </div>

        <Button onClick={onPay} disabled={loading} className="w-full">
          {loading ? <Spinner size="sm" /> : null}
          {loading ? 'Redirecting to checkout...' : 'Pay $5 & Continue'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
