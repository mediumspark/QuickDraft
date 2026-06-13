import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PartyFields({ prefix, party, onChange }) {
  const update = (field, val) => onChange({ ...party, [field]: val })

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-name`}>Name</Label>
        <Input
          id={`${prefix}-name`}
          value={party.name || ''}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Full legal name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-role`}>Role</Label>
        <Input
          id={`${prefix}-role`}
          value={party.role || ''}
          onChange={(e) => update('role', e.target.value)}
          placeholder="e.g. Founder, Investor"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${prefix}-address`}>Address</Label>
        <Input
          id={`${prefix}-address`}
          value={party.address || ''}
          onChange={(e) => update('address', e.target.value)}
          placeholder="Street, City, State, ZIP (email optional)"
        />
      </div>
    </div>
  )
}
