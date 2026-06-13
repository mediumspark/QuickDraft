import * as React from 'react'
import { Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { getCreditBalance, isPaymentsConfigured } from '@/services/payments'

export default function CreditBalance({ refreshKey = 0 }) {
  const { user } = useAuth()
  const [credits, setCredits] = React.useState(null)

  React.useEffect(() => {
    if (!user || !isPaymentsConfigured()) {
      setCredits(null)
      return
    }

    getCreditBalance().then(setCredits).catch(() => setCredits(0))
  }, [user, refreshKey])

  if (!user || credits === null) return null

  return (
    <Badge variant="secondary" className="gap-1 hidden sm:inline-flex">
      <Coins className="h-3 w-3" />
      {credits} credit{credits !== 1 ? 's' : ''}
    </Badge>
  )
}

export function useCreditBalance(refreshKey = 0) {
  const { user } = useAuth()
  const [credits, setCredits] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    if (!user || !isPaymentsConfigured()) {
      setCredits(0)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const balance = await getCreditBalance()
      setCredits(balance)
    } catch {
      setCredits(0)
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    refresh()
  }, [refresh, refreshKey])

  return { credits, loading, refresh }
}
