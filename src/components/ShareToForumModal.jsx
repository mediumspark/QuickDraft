import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { FEEDBACK_VISIBILITY } from '@/data/writing'
import { GENRE_BOARDS } from '@/data/forumBoards'
import AiBadge from '@/components/AiBadge'

export default function ShareToForumModal({
  open,
  onOpenChange,
  title,
  aiStatus,
  onPublish,
  loading,
}) {
  const [postTitle, setPostTitle] = React.useState(title || 'Untitled')
  const [visibility, setVisibility] = React.useState('accounts_only')
  const [boardSlug, setBoardSlug] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setPostTitle(title || 'Untitled')
      setVisibility('accounts_only')
      setBoardSlug('')
    }
  }, [open, title])

  const blocked = aiStatus === 'ai_generated'
  const canPublish = Boolean(postTitle.trim() && boardSlug)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share a saved draft</DialogTitle>
          <DialogDescription>
            Your writing stays in your account. Choose which genre forum to publish it to — there’s no general dump.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Label:</span>
          <AiBadge status={aiStatus} />
        </div>

        {blocked ? (
          <p className="text-sm text-destructive">
            AI-generated writing can’t be shared to the forum.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="share-title">Title</Label>
              <Input
                id="share-title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-board">Share to forum</Label>
              <Select
                id="share-board"
                value={boardSlug}
                onChange={(e) => setBoardSlug(e.target.value)}
              >
                <option value="" disabled>
                  Choose a genre forum…
                </option>
                {GENRE_BOARDS.map((b) => (
                  <option key={b.slug} value={b.slug}>{b.name}</option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Required. The draft is saved to your account first, then posted only to this forum.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feedback-vis">Who can see feedback</Label>
              <Select
                id="feedback-vis"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                {Object.values(FEEDBACK_VISIBILITY).map((o) => (
                  <option key={o.id} value={o.id}>{o.label} — {o.description}</option>
                ))}
              </Select>
            </div>
            {aiStatus === 'ai_contributed' && (
              <p className="text-xs text-muted-foreground">
                Views will be visible only to you. Section (highlight) comments are disabled for AI Contributed work.
              </p>
            )}
            <Button
              className="w-full"
              disabled={loading || !canPublish}
              onClick={() => onPublish({
                title: postTitle.trim(),
                feedbackVisibility: visibility,
                boardSlug,
              })}
            >
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Saving & sharing…' : 'Save & share to forum'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
