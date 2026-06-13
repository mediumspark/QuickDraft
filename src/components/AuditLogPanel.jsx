import * as React from 'react'
import {
  FileText, Users, DollarSign, Download, RefreshCw, Trash2, AlertTriangle,
  Coins, CreditCard,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { getAuditLog, clearAuditLog } from '@/utils/storageUtils'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  type_change: { icon: RefreshCw, color: 'text-blue-600 bg-blue-50' },
  party_edit: { icon: Users, color: 'text-purple-600 bg-purple-50' },
  financial_change: { icon: DollarSign, color: 'text-green-600 bg-green-50' },
  pdf_download: { icon: Download, color: 'text-orange-600 bg-orange-50' },
  payment_purchase: { icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
  credit_consumed: { icon: Coins, color: 'text-emerald-600 bg-emerald-50' },
  default: { icon: FileText, color: 'text-gray-600 bg-gray-50' },
}

export default function AuditLogPanel({ open, onOpenChange }) {
  const [log, setLog] = React.useState([])
  const [confirmClear, setConfirmClear] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setLog(getAuditLog())
      setConfirmClear(false)
    }
  }, [open])

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clearAuditLog()
    setLog([])
    setConfirmClear(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent open={open} onOpenChange={onOpenChange}>
        <SheetHeader>
          <SheetTitle>Audit Log</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <div className="flex justify-end mb-4">
            <Button
              variant={confirmClear ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleClear}
            >
              {confirmClear ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Confirm Clear All
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            {log.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet.</p>
            )}
            {log.map((entry) => {
              const { icon: Icon, color } = ICON_MAP[entry.type] || ICON_MAP.default
              return (
                <div key={entry.id} className="flex gap-3 rounded-lg border p-3">
                  <div className={cn('rounded-full p-2 shrink-0', color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{entry.message}</p>
                    {entry.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.detail}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
