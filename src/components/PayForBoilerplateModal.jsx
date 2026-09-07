import { FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import BoilerplatePrice from '@/components/BoilerplatePrice'
import { formatBoilerplatePrice, getBoilerplatePriceCents } from '@/data/boilerplateProducts'

export default function PayForBoilerplateModal({
  open,
  onOpenChange,
  productName,
  onPay,
  loading,
}) {
  const price = formatBoilerplatePrice(getBoilerplatePriceCents())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Pay to Download Word Doc
          </DialogTitle>
          <DialogDescription>
            Pay {price} once to download <strong>{productName}</strong> as an editable Word document (.docx).
            Re-downloading on this device is free after payment. Sign in to sync purchases across devices.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 text-center my-2">
          <BoilerplatePrice size="sm" className="items-center" />
          <p className="text-sm text-muted-foreground mt-2">one-time · .docx download</p>
        </div>

        <Button onClick={onPay} disabled={loading} className="w-full">
          {loading ? <Spinner size="sm" /> : null}
          {loading ? 'Redirecting to checkout...' : `Pay ${price} & Download`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
