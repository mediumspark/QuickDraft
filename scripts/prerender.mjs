#!/usr/bin/env node
/**
 * Prerenders indexable marketing routes to static HTML in dist/.
 * Requires: npm run build first, playwright installed.
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(root, 'dist')

const routes = [
  '/',
  '/about',
  '/guide',
  '/contact',
  '/faq',
  '/pricing',
  '/templates/revenue-sharing',
  '/templates/profit-sharing',
  '/templates/commission',
  '/templates/nda',
]

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
}

function startStaticServer() {
  return new Promise((resolvePromise) => {
    const server = createServer((req, res) => {
      const urlPath = req.url?.split('?')[0] || '/'
      let filePath = join(distDir, urlPath)

      if (urlPath.endsWith('/')) {
        filePath = join(filePath, 'index.html')
      } else if (!extname(filePath) && !existsSync(filePath)) {
        filePath = join(distDir, 'index.html')
      }

      if (!existsSync(filePath)) {
        filePath = join(distDir, 'index.html')
      }

      const ext = extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      res.end(readFileSync(filePath))
    })

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolvePromise({ server, port })
    })
  })
}

function outputPathForRoute(route) {
  if (route === '/') return join(distDir, 'index.html')
  const dir = join(distDir, route)
  mkdirSync(dir, { recursive: true })
  return join(dir, 'index.html')
}

async function main() {
  if (!existsSync(join(distDir, 'index.html'))) {
    console.error('dist/index.html not found. Run vite build first.')
    process.exit(1)
  }

  const { server, port } = await startStaticServer()
  const base = `http://127.0.0.1:${port}`

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  console.log('Prerendering routes...')

  for (const route of routes) {
    const url = `${base}${route}`
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(500)

    const html = await page.content()
    const out = outputPathForRoute(route)
    writeFileSync(out, html)
    console.log(`  ✓ ${route} → ${out.replace(distDir, 'dist')}`)
  }

  await browser.close()
  server.close()
  console.log('Prerender complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
