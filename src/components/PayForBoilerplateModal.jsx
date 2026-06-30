import { FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { BOILERPLATE_PRICE_CENTS } from '@/data/boilerplateProducts'

export default function PayForBoilerplateModal({
  open,
  onOpenChange,
  productName,
  onPay,
  loading,
}) {
  const price = (BOILERPLATE_PRICE_CENTS / 100).toFixed(0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Pay to Download Word Doc
          </DialogTitle>
          <DialogDescription>
            Pay ${price} once to download <strong>{productName}</strong> as an editable Word document (.docx).
            Re-downloading on this device is free after payment. Sign in to sync purchases across devices.
          </DialogDescription>
        </DialogHeader>

        <LegalDisclaimer variant="banner" />

        <div className="rounded-lg border bg-muted/30 p-4 text-center my-2">
          <p className="text-3xl font-bold text-primary">${price}</p>
          <p className="text-sm text-muted-foreground">one-time · .docx download</p>
        </div>

        <Button onClick={onPay} disabled={loading} className="w-full">
          {loading ? <Spinner size="sm" /> : null}
          {loading ? 'Redirecting to checkout...' : `Pay $${price} & Download`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
