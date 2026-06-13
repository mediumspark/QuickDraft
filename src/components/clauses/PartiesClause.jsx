import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CollapsibleSection } from '@/components/ui/collapsible'
import PartyFields from './PartyFields'

export default function PartiesClause({ parties, onChange, onChangeAdditional }) {
  const additional = parties?.additional || []

  const addPartner = () => {
    if (additional.length >= 4) return
    onChangeAdditional([...additional, { name: '', role: '', address: '', percentage: '' }])
  }

  const updatePartner = (index, updated) => {
    const next = [...additional]
    next[index] = updated
    onChangeAdditional(next)
  }

  const removePartner = (index) => {
    onChangeAdditional(additional.filter((_, i) => i !== index))
  }

  return (
    <CollapsibleSection title="Parties" description="Define all parties to this agreement">
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-3 text-primary">Party A</h4>
          <PartyFields
            prefix="partyA"
            party={parties.partyA || {}}
            onChange={(p) => onChange({ ...parties, partyA: p })}
          />
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3 text-primary">Party B</h4>
          <PartyFields
            prefix="partyB"
            party={parties.partyB || {}}
            onChange={(p) => onChange({ ...parties, partyB: p })}
          />
        </div>

        {additional.map((partner, i) => (
          <div key={i} className="rounded-md border border-dashed p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Additional Partner {i + 1}</h4>
              <Button type="button" variant="ghost" size="icon" onClick={() => removePartner(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <PartyFields
              prefix={`partner-${i}`}
              party={partner}
              onChange={(p) => updatePartner(i, p)}
            />
            <div className="space-y-1.5 max-w-xs">
              <Label htmlFor={`partner-${i}-pct`}>Percentage (%)</Label>
              <Input
                id={`partner-${i}-pct`}
                type="number"
                min="0"
                max="100"
                value={partner.percentage || ''}
                onChange={(e) => updatePartner(i, { ...partner, percentage: e.target.value })}
              />
            </div>
          </div>
        ))}

        {additional.length < 4 && (
          <Button type="button" variant="outline" onClick={addPartner} className="w-full">
            <Plus className="h-4 w-4" />
            Add Partner ({additional.length}/4)
          </Button>
        )}
      </div>
    </CollapsibleSection>
  )
}
