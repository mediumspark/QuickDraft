import * as React from 'react'
import { Trash2, RotateCcw, Save } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAgreementTypeLabel } from '@/utils/agreementUtils'
import { getVersions, saveVersion, deleteVersion } from '@/utils/storageUtils'

export default function VersionHistory({ open, onOpenChange, draft, onRestore }) {
  const [versions, setVersions] = React.useState([])
  const [label, setLabel] = React.useState('')

  React.useEffect(() => {
    if (open) setVersions(getVersions())
  }, [open])

  const handleSave = () => {
    if (!label.trim()) return
    saveVersion(label.trim(), draft)
    setVersions(getVersions())
    setLabel('')
  }

  const handleRestore = (version) => {
    onRestore(version.data)
    onOpenChange(false)
  }

  const handleDelete = (id) => {
    deleteVersion(id)
    setVersions(getVersions())
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent open={open} onOpenChange={onOpenChange}>
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Version label..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Button onClick={handleSave} disabled={!label.trim()}>
              <Save className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {versions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No saved versions yet.</p>
            )}
            {versions.map((v) => (
              <div key={v.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getAgreementTypeLabel(v.agreementType)} ·{' '}
                      {new Date(v.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleRestore(v)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
