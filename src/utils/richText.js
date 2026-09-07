import createDOMPurify from 'dompurify'

const HTML_RE = /<\/?[a-z][\s\S]*>/i

function getPurify() {
  if (typeof window === 'undefined') return null
  return createDOMPurify(window)
}

export function looksLikeHtml(value) {
  return HTML_RE.test(value || '')
}

export function stripHtml(value) {
  if (!value) return ''
  if (!looksLikeHtml(value)) return value
  const el = document.createElement('div')
  el.innerHTML = value
  return (el.textContent || el.innerText || '').replace(/\u00a0/g, ' ')
}

export function plainPreview(value, max = 220) {
  const plain = stripHtml(value).replace(/\s+/g, ' ').trim()
  if (!plain) return ''
  if (plain.length <= max) return plain
  return `${plain.slice(0, max).trim()}…`
}

export function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Convert legacy plain-text drafts into minimal HTML for TipTap. */
export function plainTextToHtml(text) {
  const raw = String(text || '')
  if (!raw.trim()) return '<p></p>'
  if (looksLikeHtml(raw)) return raw
  return raw
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function sanitizeHtml(html) {
  const purify = getPurify()
  if (!purify) return html || ''
  return purify.sanitize(html || '', {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['style'],
    ADD_ATTR: ['style', 'class', 'data-qd-columns', 'data-qd-fonts', 'data-qd-leading'],
  })
}

export function extractEmbeddedFonts(html) {
  const value = html || ''
  const match = value.match(/<style[^>]*data-qd-fonts[^>]*>([\s\S]*?)<\/style>/i)
  if (!match) return { fontsCss: '', bodyHtml: value }
  return {
    fontsCss: match[1],
    bodyHtml: value.replace(match[0], '').trim(),
  }
}

export function embedFonts(html, fontsCss) {
  if (!fontsCss?.trim()) return html || ''
  return `<style data-qd-fonts="true">${fontsCss}</style>${html || ''}`
}

function unwrapAttrDiv(html, attr) {
  const value = (html || '').trim()
  const re = new RegExp(
    `^<div[^>]*${attr}=["']?([^"'\\s>]+)["']?[^>]*>([\\s\\S]*)<\\/div>\\s*$`,
    'i'
  )
  const match = value.match(re)
  if (!match) return null
  return { attrValue: match[1], html: match[2] }
}

export function parseLayout(html) {
  let body = html || ''
  let columns = 1
  let doubleSpace = false

  const cols = unwrapAttrDiv(body, 'data-qd-columns')
  if (cols) {
    columns = Math.min(3, Math.max(1, Number(cols.attrValue) || 1))
    body = cols.html
  }

  const lead = unwrapAttrDiv(body, 'data-qd-leading')
  if (lead) {
    doubleSpace = lead.attrValue === '2' || lead.attrValue === '2.0'
    body = lead.html
  }

  return { html: body, columns, doubleSpace }
}

export function applyLayout(html, { columns = 1, doubleSpace = false } = {}) {
  let out = html || ''
  if (doubleSpace) {
    out = `<div data-qd-leading="2" style="line-height:2">${out}</div>`
  }
  const cols = Number(columns) || 1
  if (cols > 1) {
    out = `<div data-qd-columns="${cols}" style="column-count:${cols};column-gap:1.75rem">${out}</div>`
  }
  return out
}

export function buildFontFaceCss(fonts = []) {
  return fonts
    .map((f) => {
      const family = String(f.name || '').replace(/['"]/g, '')
      if (!family || !f.dataUrl) return ''
      let format = 'truetype'
      if (f.format === 'otf') format = 'opentype'
      else if (f.format === 'woff') format = 'woff'
      else if (f.format === 'woff2') format = 'woff2'
      return `@font-face{font-family:'${family}';src:url('${f.dataUrl}') format('${format}');font-display:swap;}`
    })
    .filter(Boolean)
    .join('')
}

export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Could not read font file'))
    reader.readAsDataURL(file)
  })
}

export async function registerFontFile(file) {
  const base = (file.name || 'CustomFont').replace(/\.[^.]+$/, '')
  const name = base.replace(/[^\w\s-]/g, '').trim() || 'CustomFont'
  const format = (file.name.split('.').pop() || 'ttf').toLowerCase()
  const dataUrl = await fileToDataUrl(file)
  const buffer = await file.arrayBuffer()
  const face = new FontFace(name, buffer)
  await face.load()
  document.fonts.add(face)
  return { name, dataUrl, format }
}

export function ensureFontsFromCss(css) {
  if (!css || typeof document === 'undefined') return
  const existing = document.getElementById('qd-embedded-fonts')
  if (existing) {
    if (!(existing.textContent || '').includes(css.slice(0, 80))) {
      existing.textContent = `${existing.textContent || ''}\n${css}`
    }
    return
  }
  const style = document.createElement('style')
  style.id = 'qd-embedded-fonts'
  style.textContent = css
  document.head.appendChild(style)
}
