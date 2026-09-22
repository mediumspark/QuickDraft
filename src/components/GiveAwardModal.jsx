import * as React from 'react'
import { Gift, Lightbulb, Heart, Pen, Sparkles, Star, Award as AwardIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  listAwards,
  listMyAwardInventory,
  spendPointsForAward,
  giveAward,
  createAwardCheckout,
  getMyWallet,
} from '@/services/supabase'

const ICONS = {
  lightbulb: Lightbulb,
  heart: Heart,
  pen: Pen,
  sparkles: Sparkles,
  star: Star,
  award: AwardIcon,
}

export function AwardIconBySlug({ icon, className }) {
  const Cmp = ICONS[icon] || Star
  return <Cmp className={className || 'h-4 w-4'} />
}

export default function GiveAwardModal({
  open,
  onOpenChange,
  postId,
  onGiven,
  addToast,
}) {
  const shopOnly = !postId
  const [awards, setAwards] = React.useState([])
  const [inventory, setInventory] = React.useState([])
  const [balance, setBalance] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [busyId, setBusyId] = React.useState(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    const [a, inv, wallet] = await Promise.all([
      listAwards(),
      listMyAwardInventory(),
      getMyWallet(),
    ])
    setAwards(a.data || [])
    setInventory(inv.data || [])
    setBalance(wallet.data?.points_balance ?? null)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    if (open) load()
  }, [open, load])

  const qtyFor = (awardId) =>
    inventory.find((r) => r.award_id === awardId)?.quantity || 0

  const buyWithPoints = async (award) => {
    setBusyId(award.id)
    try {
      const { error } = await spendPointsForAward(award.id, 1)
      if (error) throw error
      addToast(`Added ${award.name} to your inventory (−${award.points_cost} pts)`)
      await load()
      onGiven?.()
    } catch (err) {
      addToast(err.message || 'Could not buy award', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const buyWithStripe = async (award) => {
    setBusyId(`stripe-${award.id}`)
    try {
      const { data, error } = await createAwardCheckout({ awardId: award.id, quantity: 1 })
      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error('No checkout URL returned')
    } catch (err) {
      addToast(err.message || 'Stripe checkout unavailable', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const give = async (award) => {
    if (!postId) return
    setBusyId(`give-${award.id}`)
    try {
      const { error } = await giveAward(postId, award.id)
      if (error) throw error
      addToast(`Gave ${award.name}`)
      onGiven?.()
      await load()
      onOpenChange(false)
    } catch (err) {
      addToast(err.message || 'Could not give award', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{shopOnly ? 'Buy awards' : 'Give an award'}</DialogTitle>
          <DialogDescription>
            {shopOnly
              ? 'Spend points or buy with card. You’ll give awards from a post page.'
              : 'Spend points or buy with card (Stripe). Awards go into your inventory, then you place them on a post.'}
            {balance != null && (
              <span className="block mt-1 text-foreground">Your balance: {balance} pts (private)</span>
            )}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <ul className="space-y-3">
            {awards.map((award) => {
              const owned = qtyFor(award.id)
              return (
                <li key={award.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AwardIconBySlug icon={award.icon} className="h-5 w-5 text-primary mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{award.name}</p>
                      <p className="text-xs text-muted-foreground">{award.description}</p>
                      <p className="text-xs mt-1">
                        {award.points_cost} pts
                        {owned > 0 && <span className="text-muted-foreground"> · owned ×{owned}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!shopOnly && owned > 0 ? (
                      <Button size="sm" disabled={!!busyId} onClick={() => give(award)}>
                        {busyId === `give-${award.id}` ? <Spinner size="sm" /> : <Gift className="h-3.5 w-3.5 mr-1" />}
                        Give
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" disabled={!!busyId} onClick={() => buyWithPoints(award)}>
                      {busyId === award.id ? <Spinner size="sm" /> : null}
                      Buy with points
                    </Button>
                    <Button size="sm" variant="secondary" disabled={!!busyId} onClick={() => buyWithStripe(award)}>
                      {busyId === `stripe-${award.id}` ? <Spinner size="sm" /> : null}
                      Buy with card
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
