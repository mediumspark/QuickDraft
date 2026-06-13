import { CollapsibleSection } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export default function DurationClause({ duration, onChange }) {
  const update = (field, val) => onChange({ ...duration, [field]: val })

  return (
    <CollapsibleSection title="Duration & Termination" description="Term dates and exit conditions">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={duration.startDate || ''}
              onChange={(e) => update('startDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={duration.endDate || ''}
              onChange={(e) => update('endDate', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label htmlFor="auto-renewal">Auto-Renewal</Label>
            <p className="text-xs text-muted-foreground">Automatically extend the agreement</p>
          </div>
          <Switch
            id="auto-renewal"
            checked={duration.autoRenewal || false}
            onCheckedChange={(checked) => update('autoRenewal', checked)}
          />
        </div>

        {duration.autoRenewal && (
          <div className="space-y-1.5">
            <Label htmlFor="renewal-period">Renewal Period</Label>
            <Input
              id="renewal-period"
              value={duration.renewalPeriod || ''}
              onChange={(e) => update('renewalPeriod', e.target.value)}
              placeholder="e.g. 12 months"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="termination-notice">Termination Notice (days)</Label>
          <Input
            id="termination-notice"
            type="number"
            min="0"
            value={duration.terminationNoticeDays ?? 30}
            onChange={(e) => update('terminationNoticeDays', Number(e.target.value))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="termination-conditions">Termination Conditions</Label>
          <Textarea
            id="termination-conditions"
            value={duration.terminationConditions || ''}
            onChange={(e) => update('terminationConditions', e.target.value)}
            placeholder="Describe any additional conditions for termination..."
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}
