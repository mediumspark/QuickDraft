import * as React from 'react'
import { Coins } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { createCheckoutSession } from '@/services/payments'

const PACKS = [
  { credits: 1, label: '1 Credit', price: '$5' },
  { credits: 5, label: '5 Credits', price: '$25' },
  { credits: 10, label: '10 Credits', price: '$50' },
]

export default function BuyCreditsModal({ open, onOpenChange, action = 'download', onCreditsUpdated }) {
  const [loading, setLoading] = React.useState(false)
  const [selectedPack, setSelectedPack] = React.useState(1)

  const actionLabel = action === 'share' ? 'share this agreement' : 'download this PDF'

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const url = await createCheckoutSession(selectedPack)
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Buy Credits
          </DialogTitle>
          <DialogDescription>
            You need 1 credit to {actionLabel}. Each credit costs $5.
            Re-downloads and re-sharing the same agreement are free once unlocked.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 my-2">
          {PACKS.map((pack) => (
            <button
              key={pack.credits}
              type="button"
              onClick={() => setSelectedPack(pack.credits)}
              className={`rounded-lg border p-3 text-center transition-colors ${
                selectedPack === pack.credits
                  ? 'border-primary bg-accent ring-2 ring-primary/20'
                  : 'hover:border-primary/50'
              }`}
            >
              <p className="font-semibold">{pack.label}</p>
              <p className="text-sm text-muted-foreground">{pack.price}</p>
            </button>
          ))}
        </div>

        <Button onClick={handlePurchase} disabled={loading} className="w-full">
          {loading ? <Spinner size="sm" /> : null}
          {loading ? 'Redirecting to checkout...' : `Buy ${selectedPack} Credit${selectedPack > 1 ? 's' : ''}`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
