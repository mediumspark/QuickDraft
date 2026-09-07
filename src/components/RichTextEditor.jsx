import * as React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  TextStyle,
  Color,
  FontFamily,
  FontSize,
  LineHeight,
} from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Columns2,
  Upload,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import {
  plainTextToHtml,
  parseLayout,
  applyLayout,
  extractEmbeddedFonts,
  embedFonts,
  buildFontFaceCss,
  registerFontFile,
  ensureFontsFromCss,
} from '@/utils/richText'

const BUILTIN_FONTS = [
  { label: 'Fraunces', value: 'Fraunces, Georgia, serif' },
  { label: 'Figtree', value: 'Figtree, system-ui, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Garamond', value: 'Garamond, "Palatino Linotype", Palatino, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
]

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']

const COLORS = [
  { label: 'Ink', value: '#15202b' },
  { label: 'Slate', value: '#5c6672' },
  { label: 'Teal', value: '#1a5f52' },
  { label: 'Crimson', value: '#b42318' },
  { label: 'Navy', value: '#1e3a5f' },
]

function ToolBtn({ active, title, onClick, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-accent-foreground disabled:opacity-40',
        active && 'border-primary bg-accent text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function prepareIncoming(value) {
  const { fontsCss, bodyHtml } = extractEmbeddedFonts(value || '')
  if (fontsCss) ensureFontsFromCss(fontsCss)
  const layout = parseLayout(bodyHtml || '')
  return {
    editorHtml: plainTextToHtml(layout.html),
    columns: layout.columns,
    doubleSpace: layout.doubleSpace,
  }
}

function FormatToolbar({
  editor,
  customFonts,
  columns,
  setColumns,
  doubleSpace,
  setDoubleSpace,
  onUploadClick,
  fileRef,
  onUploadFont,
}) {
  const disabled = !editor
  const fontOptions = [
    ...BUILTIN_FONTS,
    ...customFonts.map((f) => ({ label: `${f.name} (custom)`, value: `'${f.name}'` })),
  ]

  return (
    <div className="border-b bg-card px-3 py-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Font</Label>
          <Select
            className="h-8 w-[10.5rem] text-xs"
            disabled={disabled}
            value={editor?.getAttributes('textStyle').fontFamily || ''}
            onChange={(e) => {
              const v = e.target.value
              if (!v) editor.chain().focus().unsetFontFamily().run()
              else editor.chain().focus().setFontFamily(v).run()
            }}
          >
            <option value="">Default</option>
            {fontOptions.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Size</Label>
          <Select
            className="h-8 w-[5.5rem] text-xs"
            disabled={disabled}
            value={editor?.getAttributes('textStyle').fontSize || ''}
            onChange={(e) => {
              const v = e.target.value
              if (!v) editor.chain().focus().unsetFontSize().run()
              else editor.chain().focus().setFontSize(v).run()
            }}
          >
            <option value="">Auto</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Color</Label>
          <div className="flex items-center gap-1">
            <Select
              className="h-8 w-[7rem] text-xs"
              disabled={disabled}
              value={editor?.getAttributes('textStyle').color || ''}
              onChange={(e) => {
                const v = e.target.value
                if (!v) editor.chain().focus().unsetColor().run()
                else editor.chain().focus().setColor(v).run()
              }}
            >
              <option value="">Default</option>
              {COLORS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
            <input
              type="color"
              title="Custom color"
              disabled={disabled}
              className="h-8 w-8 cursor-pointer rounded-md border bg-background p-0.5 disabled:opacity-40"
              value={editor?.getAttributes('textStyle').color || '#15202b'}
              onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 pb-0.5">
          <ToolBtn
            title="Bold"
            disabled={disabled}
            active={editor?.isActive('bold')}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            title="Italic"
            disabled={disabled}
            active={editor?.isActive('italic')}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            title="Underline"
            disabled={disabled}
            active={editor?.isActive('underline')}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            title="Strikethrough"
            disabled={disabled}
            active={editor?.isActive('strike')}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            title="Bullet list"
            disabled={disabled}
            active={editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            title="Numbered list"
            disabled={disabled}
            active={editor?.isActive('orderedList')}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Spacing</Label>
          <Button
            type="button"
            size="sm"
            variant={doubleSpace ? 'default' : 'outline'}
            className="h-8"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setDoubleSpace((v) => !v)}
          >
            <Type className="h-3.5 w-3.5 mr-1" />
            Double space
          </Button>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Columns</Label>
          <Select
            className="h-8 w-[6.5rem] text-xs"
            disabled={disabled}
            value={String(columns)}
            onChange={(e) => setColumns(Number(e.target.value))}
          >
            <option value="1">1 column</option>
            <option value="2">2 columns</option>
            <option value="3">3 columns</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Custom font</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            disabled={disabled}
            onClick={onUploadClick}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            className="hidden"
            onChange={onUploadFont}
          />
        </div>
      </div>
      {columns > 1 && (
        <p className="mt-2 text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <Columns2 className="h-3.5 w-3.5" />
          Multi-column layout is on — best with longer drafts.
        </p>
      )}
    </div>
  )
}

export default function RichTextEditor(props) {
  return (
    <EditorErrorBoundary>
      <RichTextEditorInner {...props} />
    </EditorErrorBoundary>
  )
}

class EditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive">
          Formatting toolbar failed to load: {this.state.error.message || 'Unknown error'}.
          Try a hard refresh.
        </div>
      )
    }
    return this.props.children
  }
}

function RichTextEditorInner({
  value = '',
  onChange,
  contentKey = 'default',
  placeholder = 'Start writing…',
  className,
  minHeightClass = 'min-h-[55vh]',
}) {
  const fileRef = React.useRef(null)
  const customFontsRef = React.useRef([])
  const [customFonts, setCustomFonts] = React.useState([])
  const [columns, setColumns] = React.useState(1)
  const [doubleSpace, setDoubleSpace] = React.useState(false)
  const [initError, setInitError] = React.useState('')
  const layoutRef = React.useRef({ columns: 1, doubleSpace: false })
  const { addToast } = useToast()

  const seed = React.useMemo(() => prepareIncoming(value), [contentKey]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setColumns(seed.columns)
    setDoubleSpace(seed.doubleSpace)
    layoutRef.current = { columns: seed.columns, doubleSpace: seed.doubleSpace }
  }, [seed])

  const pushChange = React.useCallback((ed) => {
    if (!onChange || !ed) return
    const fontsCss = buildFontFaceCss(customFontsRef.current)
    const inner = ed.getHTML()
    const laid = applyLayout(inner, layoutRef.current)
    onChange(embedFonts(laid, fontsCss))
  }, [onChange])

  const editor = useEditor({
    immediatelyRender: true,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        link: false,
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineHeight,
      Placeholder.configure({ placeholder }),
    ],
    content: seed.editorHtml,
    editorProps: {
      attributes: {
        class: cn(
          'qd-editor ProseMirror outline-none max-w-none font-document text-lg px-1',
          minHeightClass
        ),
      },
    },
    onCreate: () => setInitError(''),
    onUpdate: ({ editor: ed }) => pushChange(ed),
  }, [contentKey])

  React.useEffect(() => {
    layoutRef.current = { columns, doubleSpace }
    if (editor) pushChange(editor)
  }, [columns, doubleSpace, editor, pushChange])

  React.useEffect(() => {
    if (editor || initError) return undefined
    const t = setTimeout(() => {
      if (!editor) setInitError('Editor failed to start. Refresh the page.')
    }, 2500)
    return () => clearTimeout(t)
  }, [editor, initError])

  const onUploadFont = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editor) return
    if (file.size > 2 * 1024 * 1024) {
      addToast('Font file must be under 2MB', 'error')
      return
    }
    try {
      const font = await registerFontFile(file)
      const next = [...customFontsRef.current.filter((f) => f.name !== font.name), font]
      customFontsRef.current = next
      setCustomFonts(next)
      ensureFontsFromCss(buildFontFaceCss([font]))
      editor.chain().focus().setFontFamily(`'${font.name}'`).run()
      pushChange(editor)
      addToast(`Font “${font.name}” ready`)
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'Could not load font', 'error')
    }
  }

  return (
    <div className={cn('flex flex-col rounded-lg border bg-card overflow-hidden', className)}>
      <FormatToolbar
        editor={editor}
        customFonts={customFonts}
        columns={columns}
        setColumns={setColumns}
        doubleSpace={doubleSpace}
        setDoubleSpace={setDoubleSpace}
        onUploadClick={() => fileRef.current?.click()}
        fileRef={fileRef}
        onUploadFont={onUploadFont}
      />

      <div
        className={cn('qd-editor-shell px-3 py-4', doubleSpace && 'qd-double-space')}
        style={columns > 1 ? { columnCount: columns, columnGap: '1.75rem' } : undefined}
      >
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className={cn('animate-pulse rounded-md bg-muted/40', minHeightClass)}>
            {initError && (
              <p className="p-4 text-sm text-destructive">{initError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
