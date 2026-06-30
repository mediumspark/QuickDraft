#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const siteUrl = (process.env.VITE_SITE_URL || 'https://www.aquickdraft.com').replace(/\/$/, '')

const routes = [
  '/',
  '/about',
  '/guide',
  '/contact',
  '/faq',
  '/pricing',
  '/boilerplates',
  '/boilerplates/simple-template',
  '/templates/revenue-sharing',
  '/templates/profit-sharing',
  '/templates/commission',
  '/templates/nda',
]

const lastmod = new Date().toISOString().slice(0, 10)

const urls = routes
  .map((path) => {
    const loc = path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${path === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

const publicPath = resolve(root, 'public', 'sitemap.xml')
const distPath = resolve(root, 'dist', 'sitemap.xml')

writeFileSync(publicPath, xml)
console.log(`Wrote ${publicPath}`)

try {
  writeFileSync(distPath, xml)
  console.log(`Wrote ${distPath}`)
} catch {
  // dist may not exist before first build
}
