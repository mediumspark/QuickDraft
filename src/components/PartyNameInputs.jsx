import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PartyNameInputs({ parties, onChange }) {
  const update = (key, name) => {
    onChange({
      ...parties,
      [key]: { ...parties[key], name },
    })
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4 mb-4">
      <p className="text-sm font-medium">Enter your name before signing</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="view-party-a">Party A Name</Label>
          <Input
            id="view-party-a"
            value={parties.partyA?.name || ''}
            onChange={(e) => update('partyA', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="view-party-b">Party B Name</Label>
          <Input
            id="view-party-b"
            value={parties.partyB?.name || ''}
            onChange={(e) => update('partyB', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
