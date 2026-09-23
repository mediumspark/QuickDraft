import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Pause, Play, RotateCcw, Save, Share2, Eye, EyeOff, Shuffle, ArrowLeft,
  Maximize2, Minimize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import AuthModal from '@/components/AuthModal'
import ShareToForumModal from '@/components/ShareToForumModal'
import AiBadge from '@/components/AiBadge'
import RichTextEditor from '@/components/RichTextEditor'
import { ChapterSidebar, PageLayoutControls } from '@/components/ChapterTools'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  AI_STATUS, WRITING_PROMPTS, TIMER_PRESETS, formatTime,
} from '@/data/writing'
import { GENRE_BOARDS } from '@/data/forumBoards'
import { normalizeChapters, createChapter, reorderChapters } from '@/data/chapters'
import { DEFAULT_PAGE_LAYOUT, normalizePageLayout, estimateChaptersPageCount } from '@/data/pageLayout'
import {
  countWords, getDraft, saveDraft, publishToForum, isSupabaseConfigured,
} from '@/services/supabase'
import { cn } from '@/lib/utils'

const LOCAL_KEY = 'aqd_local_draft'

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')
  } catch {
    return null
  }
}

function saveLocal(draft) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(draft))
}

function getFullscreenElement() {
  return (
    document.fullscreenElement
    || document.webkitFullscreenElement
    || document.msFullscreenElement
    || null
  )
}

async function requestBrowserFullscreen(el) {
  const target = el || document.documentElement
  if (target.requestFullscreen) return target.requestFullscreen()
  if (target.webkitRequestFullscreen) return target.webkitRequestFullscreen()
  if (target.msRequestFullscreen) return target.msRequestFullscreen()
  throw new Error('Fullscreen is not supported in this browser')
}

async function exitBrowserFullscreen() {
  if (!getFullscreenElement()) return
  if (document.exitFullscreen) return document.exitFullscreen()
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen()
  if (document.msExitFullscreen) return document.msExitFullscreen()
}

export default function Write() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthConfigured } = useAuth()
  const { addToast } = useToast()

  const [title, setTitle] = React.useState('Untitled')
  const [chapters, setChapters] = React.useState(() => normalizeChapters(null, ''))
  const [activeChapter, setActiveChapter] = React.useState(0)
  const [pageLayout, setPageLayout] = React.useState(DEFAULT_PAGE_LAYOUT)
  const [measuredPages, setMeasuredPages] = React.useState(null)
  const [prompt, setPrompt] = React.useState('')
  const [aiStatus, setAiStatus] = React.useState('ai_free')
  const [wordGoal, setWordGoal] = React.useState('')
  const [timerSeconds, setTimerSeconds] = React.useState(25 * 60)
  const [remaining, setRemaining] = React.useState(25 * 60)
  const [running, setRunning] = React.useState(false)
  const [chromeVisible, setChromeVisible] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [draftId, setDraftId] = React.useState(id || null)
  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(!!id)
  const [authOpen, setAuthOpen] = React.useState(false)
  const [shareOpen, setShareOpen] = React.useState(false)
  const [publishing, setPublishing] = React.useState(false)
  const [flash, setFlash] = React.useState(false)
  const [editorKey, setEditorKey] = React.useState('boot')
  const [sessionOpen, setSessionOpen] = React.useState(false)
  const rootRef = React.useRef(null)

  const safeIndex = Math.min(activeChapter, Math.max(0, chapters.length - 1))
  const currentChapter = chapters[safeIndex] || chapters[0]
  const body = currentChapter?.body || ''
  const allBody = chapters.map((c) => c.body || '').join('\n')
  const wordCount = countWords(allBody)
  const pageCount = measuredPages
    ?? estimateChaptersPageCount(chapters, pageLayout)
  const goalNum = wordGoal ? Number(wordGoal) : null

  const setChapterBody = (html) => {
    setChapters((prev) => {
      const next = normalizeChapters(prev)
      const idx = Math.min(activeChapter, next.length - 1)
      next[idx] = { ...next[idx], body: html }
      return next
    })
  }

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      if (id && isSupabaseConfigured() && user) {
        setLoading(true)
        const { data, error } = await getDraft(id)
        if (cancelled) return
        if (error || !data) {
          addToast('Could not load draft', 'error')
          setLoading(false)
          return
        }
        setDraftId(data.id)
        setTitle(data.title || 'Untitled')
        const ch = normalizeChapters(data.chapters, data.body || '')
        setChapters(ch)
        setActiveChapter(0)
        setPageLayout(normalizePageLayout(data.page_layout || DEFAULT_PAGE_LAYOUT))
        setPrompt(data.prompt || '')
        setAiStatus(data.ai_status || 'ai_free')
        setWordGoal(data.word_goal ? String(data.word_goal) : '')
        setTimerSeconds(data.timer_seconds || 1500)
        setRemaining(data.timer_seconds || 1500)
        setEditorKey(`cloud-${data.id}-0-${data.updated_at || Date.now()}`)
        setLoading(false)
        return
      }

      if (!id) {
        const local = loadLocal()
        if (local) {
          setTitle(local.title || 'Untitled')
          const ch = normalizeChapters(local.chapters, local.body || '')
          setChapters(ch)
          setActiveChapter(local.activeChapter || 0)
          setPageLayout(normalizePageLayout(local.pageLayout || DEFAULT_PAGE_LAYOUT))
          setPrompt(local.prompt || '')
          setAiStatus(local.aiStatus || 'ai_free')
          setWordGoal(local.wordGoal || '')
          setTimerSeconds(local.timerSeconds || 1500)
          setRemaining(local.timerSeconds || 1500)
          setDraftId(local.id || null)
          setEditorKey(`local-${local.id || 'new'}-0`)
        } else {
          setEditorKey('local-empty')
        }
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, user, addToast])

  React.useEffect(() => {
    const snapshot = {
      id: draftId,
      title,
      chapters,
      activeChapter: safeIndex,
      pageLayout,
      body: allBody,
      prompt,
      aiStatus,
      wordGoal,
      timerSeconds,
    }
    saveLocal(snapshot)
  }, [draftId, title, chapters, safeIndex, pageLayout, allBody, prompt, aiStatus, wordGoal, timerSeconds])

  React.useEffect(() => {
    if (!running) return undefined
    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          setFlash(true)
          addToast('Time’s up — nice work')
          setTimeout(() => setFlash(false), 1200)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [running, addToast])

  React.useEffect(() => {
    if (!user || !isSupabaseConfigured()) return undefined
    const handle = setTimeout(async () => {
      const { data } = await saveDraft({
        id: draftId,
        title,
        chapters,
        page_layout: pageLayout,
        page_count: pageCount,
        prompt,
        ai_status: aiStatus,
        word_goal: goalNum || null,
        timer_seconds: timerSeconds,
      })
      if (data?.id && data.id !== draftId) {
        setDraftId(data.id)
        if (!id) navigate(`/write/${data.id}`, { replace: true })
      }
    }, 2000)
    return () => clearTimeout(handle)
  }, [user, draftId, title, chapters, pageLayout, pageCount, prompt, aiStatus, goalNum, timerSeconds, id, navigate])

  React.useEffect(() => {
    const syncFullscreen = () => {
      const active = !!getFullscreenElement()
      setIsFullscreen(active)
      if (active) setChromeVisible(false)
      else setChromeVisible(true)
    }
    syncFullscreen()
    document.addEventListener('fullscreenchange', syncFullscreen)
    document.addEventListener('webkitfullscreenchange', syncFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen)
      document.removeEventListener('webkitfullscreenchange', syncFullscreen)
    }
  }, [])

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !getFullscreenElement()) {
        setChromeVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (getFullscreenElement()) {
        await exitBrowserFullscreen()
      } else {
        await requestBrowserFullscreen(rootRef.current || document.documentElement)
      }
    } catch (err) {
      addToast(err?.message || 'Could not enter fullscreen', 'error')
    }
  }

  const draftPayload = () => ({
    id: draftId,
    title,
    chapters,
    page_layout: pageLayout,
    page_count: pageCount,
    prompt,
    ai_status: aiStatus,
    word_goal: goalNum || null,
    timer_seconds: timerSeconds,
  })

  const handleSave = async () => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    setSaving(true)
    try {
      const { data, error } = await saveDraft(draftPayload())
      if (error) throw error
      if (data?.id) {
        setDraftId(data.id)
        if (!id) navigate(`/write/${data.id}`, { replace: true })
      }
      addToast(data?.offline ? 'Saved locally' : 'Draft saved')
    } catch (err) {
      addToast(err.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleShareClick = () => {
    if (!user) {
      setAuthOpen(true)
      addToast('Sign in so drafts save to your account before sharing', 'error')
      return
    }
    if (aiStatus === 'ai_generated') {
      addToast('AI-generated writing can’t be shared to a forum', 'error')
      return
    }
    setShareOpen(true)
  }

  const handlePublish = async ({ title: postTitle, feedbackVisibility, boardSlug }) => {
    if (!boardSlug) {
      addToast('Choose which forum to share to', 'error')
      return
    }
    setPublishing(true)
    try {
      let ensureId = draftId
      const saved = await saveDraft({ ...draftPayload(), title: postTitle })
      if (saved.error) throw saved.error
      ensureId = saved.data?.id || draftId
      if (saved.data?.id) {
        setDraftId(saved.data.id)
        if (!id) navigate(`/write/${saved.data.id}`, { replace: true })
      }

      const { data, error } = await publishToForum({
        title: postTitle,
        chapters,
        pageLayout,
        pageCount,
        draftId: ensureId,
        aiStatus,
        feedbackVisibility,
        boardSlug,
        postKind: 'writing',
      })
      if (error) throw error
      const boardName = GENRE_BOARDS.find((b) => b.slug === boardSlug)?.name || boardSlug
      addToast(`Shared to ${boardName} · ${pageCount} page${pageCount === 1 ? '' : 's'}`)
      setShareOpen(false)
      navigate(`/forum/post/${data.id}`)
    } catch (err) {
      addToast(err.message || 'Publish failed', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const pickPrompt = () => {
    const next = WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)]
    setPrompt(next)
  }

  const selectChapter = (i) => {
    setActiveChapter(i)
    setMeasuredPages(null)
    setEditorKey(`ch-${chapters[i]?.id || i}-${Date.now()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner />
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'min-h-screen flex flex-col bg-background',
        isFullscreen && 'h-screen min-h-screen overflow-auto',
        flash && 'ring-4 ring-primary ring-inset'
      )}
    >
      {chromeVisible && (
        <div className="border-b bg-card/90 backdrop-blur sticky top-0 z-20">
          <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="max-w-xs font-semibold border-0 shadow-none focus-visible:ring-0 px-1"
                placeholder="Title"
              />
              <AiBadge status={aiStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
              <Button size="sm" onClick={handleShareClick} disabled={aiStatus === 'ai_generated'}>
                <Share2 className="h-4 w-4" />
                Share to forum
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (like F11)'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setChromeVisible(false)} title="Hide controls (Esc)">
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="container mx-auto px-4 pb-3 space-y-3">
            <PageLayoutControls layout={pageLayout} pageCount={pageCount} onChange={setPageLayout} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSessionOpen((o) => !o)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {sessionOpen ? 'Hide session options' : 'Session options (prompt, AI label)'}
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('font-mono text-lg tabular-nums', remaining === 0 && 'text-primary')}>
                  {formatTime(remaining)}
                </span>
                <Button size="sm" variant="outline" onClick={() => setRunning((r) => !r)}>
                  {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRunning(false)
                    setRemaining(timerSeconds)
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {sessionOpen && (
              <div className="mt-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Timer preset</Label>
                  <Select
                    value={String(timerSeconds)}
                    onChange={(e) => {
                      const s = Number(e.target.value)
                      setTimerSeconds(s)
                      setRemaining(s)
                      setRunning(false)
                    }}
                  >
                    {TIMER_PRESETS.map((p) => (
                      <option key={p.seconds} value={p.seconds}>{p.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Word goal</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={wordGoal}
                    onChange={(e) => setWordGoal(e.target.value)}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Prompt</Label>
                    <Button type="button" size="sm" variant="ghost" className="h-6 text-xs" onClick={pickPrompt}>
                      <Shuffle className="h-3 w-3 mr-1" />
                      Random
                    </Button>
                  </div>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Optional writing prompt"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                  <Label className="text-xs">AI assistance</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(AI_STATUS).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAiStatus(opt.id)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                          aiStatus === opt.id
                            ? 'border-primary bg-accent ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/40'
                        )}
                      >
                        <span className="font-medium block">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.short}</span>
                      </button>
                    ))}
                  </div>
                  {aiStatus === 'ai_generated' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      AI-generated writing can’t be shared to the forum.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!chromeVisible && (
        <div className="fixed top-3 right-3 z-30 flex items-center gap-2">
          {isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-full border bg-card/90 p-2 shadow-sm text-muted-foreground hover:text-foreground"
              title="Exit fullscreen (Esc)"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setChromeVisible(true)}
            className="rounded-full border bg-card/90 p-2 shadow-sm text-muted-foreground hover:text-foreground"
            title="Show controls"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl flex flex-col gap-4">
        {prompt && (
          <p className="text-sm italic text-muted-foreground font-document border-l-2 border-primary/30 pl-3">
            {prompt}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-6 flex-1">
          <ChapterSidebar
            chapters={chapters}
            activeIndex={safeIndex}
            onSelect={selectChapter}
            onChangeTitle={(i, t) => {
              setChapters((prev) => {
                const next = normalizeChapters(prev)
                next[i] = { ...next[i], title: t }
                return next
              })
            }}
            onAdd={() => {
              setChapters((prev) => {
                const next = normalizeChapters(prev)
                next.push(createChapter(`Chapter ${next.length + 1}`, '', next.length))
                return next
              })
              const nextIdx = chapters.length
              setActiveChapter(nextIdx)
              setEditorKey(`ch-new-${Date.now()}`)
            }}
            onRemove={(i) => {
              setChapters((prev) => {
                const next = normalizeChapters(prev)
                if (next.length <= 1) return next
                next.splice(i, 1)
                return next.map((c, idx) => ({ ...c, sort_order: idx }))
              })
              setActiveChapter((a) => Math.max(0, Math.min(a, chapters.length - 2)))
              setEditorKey(`ch-rm-${Date.now()}`)
            }}
            onMove={(from, to) => {
              setChapters((prev) => reorderChapters(prev, from, to))
              setActiveChapter(to)
              setEditorKey(`ch-mv-${Date.now()}`)
            }}
          />
          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-xs text-muted-foreground mb-2">
              Editing: {currentChapter?.title || `Chapter ${safeIndex + 1}`}
            </p>
            <RichTextEditor
              contentKey={editorKey}
              value={body}
              onChange={setChapterBody}
              placeholder="Start writing this chapter…"
              className="flex-1"
              minHeightClass="min-h-[55vh]"
              pageLayout={pageLayout}
              onMeasuredPageCount={setMeasuredPages}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground pt-4 border-t">
          <span>
            {wordCount} word{wordCount === 1 ? '' : 's'}
            {goalNum ? ` / ${goalNum} goal` : ''}
            {' · '}
            {pageCount} page{pageCount === 1 ? '' : 's'}
            {' · '}
            {chapters.length} chapter{chapters.length === 1 ? '' : 's'}
          </span>
          <span>
            {isFullscreen
              ? 'Esc exits fullscreen'
              : 'Fullscreen hides the browser chrome · Esc toggles controls'}
          </span>
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath="/write" isConfigured={isAuthConfigured} />
      <ShareToForumModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={title}
        aiStatus={aiStatus}
        onPublish={handlePublish}
        loading={publishing}
      />
    </div>
  )
}
