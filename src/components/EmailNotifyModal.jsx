import * as React from 'react'
import { Mail, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { sendManualEmails } from '@/utils/emailUtils'

export default function EmailNotifyModal({ open, onOpenChange, draft }) {
  const [emails, setEmails] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState(null)

  React.useEffect(() => {
    if (open) {
      setEmails('')
      setResults(null)
    }
  }, [open])

  const handleSend = async () => {
    const recipients = emails
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(e))

    if (!recipients.length) return

    setLoading(true)
    try {
      const res = await sendManualEmails(recipients, draft)
      setResults(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Agreement Summary</DialogTitle>
          <DialogDescription>
            Send a plain-text summary to recipients after downloading your PDF.
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="recipient-emails">Recipient Emails</Label>
              <Input
                id="recipient-emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
              />
            </div>
            <Button onClick={handleSend} disabled={loading || !emails.trim()} className="w-full">
              {loading ? <Spinner size="sm" /> : <Mail className="h-4 w-4" />}
              {loading ? 'Sending...' : 'Send Summary'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.email}
                className="flex items-center gap-2 rounded-md border p-3 text-sm"
              >
                {r.success ? (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span className="flex-1 truncate">{r.email}</span>
                <span className={r.success ? 'text-primary' : 'text-destructive'}>
                  {r.success ? 'Sent' : r.error || 'Failed'}
                </span>
              </div>
            ))}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full mt-2">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
