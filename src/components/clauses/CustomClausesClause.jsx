import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CollapsibleSection } from '@/components/ui/collapsible'

export default function CustomClausesClause({ clauses = [], onChange }) {
  const addClause = () => {
    onChange([...clauses, { id: crypto.randomUUID(), title: '', body: '' }])
  }

  const updateClause = (index, field, val) => {
    const next = [...clauses]
    next[index] = { ...next[index], [field]: val }
    onChange(next)
  }

  const removeClause = (index) => {
    onChange(clauses.filter((_, i) => i !== index))
  }

  return (
    <CollapsibleSection title="Custom Clauses" description="Add your own provisions">
      <div className="space-y-4">
        {clauses.map((clause, i) => (
          <div key={clause.id || i} className="rounded-md border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Clause {i + 1}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeClause(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`clause-title-${i}`}>Title</Label>
              <Input
                id={`clause-title-${i}`}
                value={clause.title || ''}
                onChange={(e) => updateClause(i, 'title', e.target.value)}
                placeholder="e.g. Non-Compete"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`clause-body-${i}`}>Body</Label>
              <Textarea
                id={`clause-body-${i}`}
                value={clause.body || ''}
                onChange={(e) => updateClause(i, 'body', e.target.value)}
                placeholder="Full clause text..."
                rows={4}
              />
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addClause} className="w-full">
          <Plus className="h-4 w-4" />
          Add Clause
        </Button>
      </div>
    </CollapsibleSection>
  )
}
