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

function ToolBtn({ active, title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
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
    fontsCss,
    editorHtml: plainTextToHtml(layout.html),
    columns: layout.columns,
    doubleSpace: layout.doubleSpace,
  }
}

export default function RichTextEditor({
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
  const layoutRef = React.useRef({ columns: 1, doubleSpace: false })
  const { addToast } = useToast()

  const seed = React.useMemo(() => prepareIncoming(value), [contentKey]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setColumns(seed.columns)
    setDoubleSpace(seed.doubleSpace)
    layoutRef.current = { columns: seed.columns, doubleSpace: seed.doubleSpace }
  }, [seed])

  const pushChange = React.useCallback((editor) => {
    if (!onChange || !editor) return
    const fontsCss = buildFontFaceCss(customFontsRef.current)
    const inner = editor.getHTML()
    const laid = applyLayout(inner, layoutRef.current)
    onChange(embedFonts(laid, fontsCss))
  }, [onChange])

  const editor = useEditor({
    immediatelyRender: false,
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
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: seed.editorHtml,
    editorProps: {
      attributes: {
        class: cn(
          'qd-editor outline-none max-w-none font-document text-lg',
          minHeightClass
        ),
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor: ed }) => pushChange(ed),
  }, [contentKey])

  React.useEffect(() => {
    layoutRef.current = { columns, doubleSpace }
    if (editor) pushChange(editor)
  }, [columns, doubleSpace, editor, pushChange])

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

  if (!editor) {
    return <div className={cn('animate-pulse rounded-md bg-muted/40', minHeightClass)} />
  }

  const fontOptions = [
    ...BUILTIN_FONTS,
    ...customFonts.map((f) => ({ label: `${f.name} (custom)`, value: `'${f.name}'` })),
  ]

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="sticky top-0 z-10 rounded-lg border bg-card/95 backdrop-blur px-2 py-2 shadow-sm">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Font</Label>
            <Select
              className="h-8 w-[10.5rem] text-xs"
              value={editor.getAttributes('textStyle').fontFamily || ''}
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
              value={editor.getAttributes('textStyle').fontSize || ''}
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
                value={editor.getAttributes('textStyle').color || ''}
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
                className="h-8 w-8 cursor-pointer rounded-md border bg-background p-0.5"
                value={editor.getAttributes('textStyle').color || '#15202b'}
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 pb-0.5">
            <ToolBtn
              title="Bold"
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              title="Italic"
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              title="Underline"
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              title="Strikethrough"
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              title="Bullet list"
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              title="Numbered list"
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
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
              onClick={() => fileRef.current?.click()}
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

      <div
        className={cn('qd-editor-shell', doubleSpace && 'qd-double-space')}
        style={columns > 1 ? { columnCount: columns, columnGap: '1.75rem' } : undefined}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
