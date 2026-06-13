import { CollapsibleSection } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export default function DisputeClause({ dispute, onChange }) {
  const update = (field, val) => onChange({ ...dispute, [field]: val })

  return (
    <CollapsibleSection title="Dispute Resolution" description="How conflicts will be resolved">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="resolution-method">Resolution Method</Label>
          <Select
            id="resolution-method"
            value={dispute.method || 'arbitration'}
            onChange={(e) => update('method', e.target.value)}
          >
            <option value="arbitration">Binding Arbitration</option>
            <option value="litigation">Litigation</option>
            <option value="mediation_arbitration">Mediation then Arbitration</option>
          </Select>
        </div>

        {dispute.method !== 'litigation' && (
          <div className="space-y-1.5">
            <Label htmlFor="arbitration-rules">Arbitration Rules (optional)</Label>
            <Input
              id="arbitration-rules"
              value={dispute.arbitrationRules || ''}
              onChange={(e) => update('arbitrationRules', e.target.value)}
              placeholder="e.g. AAA Commercial Arbitration Rules"
            />
          </div>
        )}

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label htmlFor="mediation-step">Require Mediation First</Label>
            <p className="text-xs text-muted-foreground">Attempt mediation before arbitration</p>
          </div>
          <Switch
            id="mediation-step"
            checked={dispute.mediationStep || false}
            onCheckedChange={(checked) => update('mediationStep', checked)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="governing-state">Governing State</Label>
            <Input
              id="governing-state"
              value={dispute.governingState || ''}
              onChange={(e) => update('governingState', e.target.value)}
              placeholder="e.g. Delaware"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="governing-country">Governing Country</Label>
            <Input
              id="governing-country"
              value={dispute.governingCountry || ''}
              onChange={(e) => update('governingCountry', e.target.value)}
              placeholder="United States"
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}
