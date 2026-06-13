import * as React from 'react'
import { StickyNote, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { getNotes, saveNotes } from '@/utils/storageUtils'
import { cn } from '@/lib/utils'

export default function AgreementNotes() {
  const [open, setOpen] = React.useState(false)
  const [notes, setNotes] = React.useState([])
  const [newNote, setNewNote] = React.useState('')
  const [editingId, setEditingId] = React.useState(null)
  const [editText, setEditText] = React.useState('')

  React.useEffect(() => {
    setNotes(getNotes())
  }, [])

  const persist = (updated) => {
    setNotes(updated)
    saveNotes(updated)
  }

  const addNote = () => {
    if (!newNote.trim()) return
    persist([
      { id: crypto.randomUUID(), body: newNote.trim(), createdAt: new Date().toISOString() },
      ...notes,
    ])
    setNewNote('')
  }

  const deleteNote = (id) => {
    persist(notes.filter((n) => n.id !== id))
  }

  const startEdit = (note) => {
    setEditingId(note.id)
    setEditText(note.body)
  }

  const saveEdit = (id) => {
    persist(notes.map((n) => (n.id === id ? { ...n, body: editText } : n)))
    setEditingId(null)
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100 transition-colors">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-700" />
          <span className="font-medium text-amber-900">Internal Notes</span>
          {notes.length > 0 && <Badge variant="amber">{notes.length}</Badge>}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-amber-700 transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
        <div className="flex gap-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="bg-white border-amber-200"
          />
          <Button onClick={addNote} className="shrink-0 self-end" disabled={!newNote.trim()}>
            Add
          </Button>
        </div>

        {notes.map((note) => (
          <div
            key={note.id}
            className="group relative rounded-md border border-amber-200 bg-white p-3 cursor-pointer"
            onClick={() => editingId !== note.id && startEdit(note)}
          >
            {editingId === note.id ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  autoFocus
                />
                <Button size="sm" onClick={() => saveEdit(note.id)}>Save</Button>
              </div>
            ) : (
              <>
                <p className="text-sm">{note.body}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
