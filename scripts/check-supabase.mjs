#!/usr/bin/env node
/**
 * Validates Supabase env vars and writing-app tables.
 * Usage: node scripts/check-supabase.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')

function loadEnv() {
  if (!existsSync(envPath)) {
    return null
  }
  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
  return env
}

const env = loadEnv()

console.log('AQuickDraft Supabase configuration check\n')

if (!env) {
  console.log('✗ No .env file found')
  console.log('\nRun: cp .env.example .env')
  console.log('Then add your Supabase URL and anon key from:')
  console.log('https://supabase.com/dashboard/project/_/settings/api\n')
  process.exit(1)
}

const url = env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const anonKey = env.VITE_SUPABASE_ANON_KEY
const siteUrl = env.VITE_SITE_URL?.replace(/\/$/, '')
let ok = true

function check(label, pass, hint) {
  const icon = pass ? '✓' : '✗'
  console.log(`${icon} ${label}`)
  if (!pass && hint) console.log(`  → ${hint}`)
  if (!pass) ok = false
}

check('VITE_SITE_URL is set', !!siteUrl, 'Add VITE_SITE_URL=https://www.aquickdraft.com to .env')
check('VITE_SUPABASE_URL is set', !!url, 'Add VITE_SUPABASE_URL to .env')
check('VITE_SUPABASE_URL is not a placeholder', url && !url.includes('your-project'), 'Replace with your project URL')
check('VITE_SUPABASE_ANON_KEY is set', !!anonKey, 'Add VITE_SUPABASE_ANON_KEY to .env')
check('VITE_SUPABASE_ANON_KEY is not a placeholder', anonKey && !anonKey.includes('your-anon'), 'Replace with your anon public key')

if (!url || !anonKey || url.includes('your-project') || anonKey.includes('your-anon')) {
  console.log('\nFix .env then run this script again.')
  process.exit(1)
}

console.log('\nTesting Supabase connection...')

try {
  const health = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: anonKey },
  })
  check('Auth API reachable', health.ok, `Got HTTP ${health.status}`)

  const settings = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: anonKey },
  })
  if (settings.ok) {
    const data = await settings.json()
    const googleEnabled = !!data?.external?.google
    check('Google auth provider enabled', googleEnabled, 'Enable Google in Supabase → Authentication → Providers → Google')
  } else {
    check('Auth settings reachable', false, `Got HTTP ${settings.status}`)
  }
} catch (err) {
  check('Network connection', false, err.message)
}

console.log('\nChecking writing tables (schema.sql must be applied)...')

const tables = ['profiles', 'drafts', 'forum_posts', 'post_views', 'forum_comments']

for (const table of tables) {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })
    const missing = res.status === 404 || res.status === 406
    const text = await res.text()
    const schemaMiss = /schema cache|does not exist|Could not find/i.test(text)
    check(
      `Table public.${table}`,
      res.ok || res.status === 200 || res.status === 401 || (res.status === 400 && !schemaMiss),
      missing || schemaMiss
        ? `Not found. Run supabase/schema.sql in the SQL Editor, then retry.`
        : `HTTP ${res.status}: ${text.slice(0, 160)}`
    )
  } catch (err) {
    check(`Table public.${table}`, false, err.message)
  }
}

try {
  const rpc = await fetch(`${url}/rest/v1/rpc/record_post_view`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_post_id: '00000000-0000-0000-0000-000000000000',
      p_viewer_key: 'schema-check',
    }),
  })
  const text = await rpc.text()
  const schemaMiss = /schema cache|Could not find.*record_post_view/i.test(text)
  check(
    'RPC record_post_view',
    !schemaMiss && rpc.status !== 404,
    schemaMiss
      ? 'Missing. Run supabase/schema.sql in the SQL Editor.'
      : `HTTP ${rpc.status} (0 return for unknown post is OK)`
  )
} catch (err) {
  check('RPC record_post_view', false, err.message)
}

const displaySiteUrl = siteUrl || 'https://www.aquickdraft.com'

console.log('\nNext steps:')
console.log('1. Open Supabase → SQL Editor')
console.log('2. Paste and run the full contents of supabase/schema.sql')
console.log('3. Confirm tables under Table Editor: profiles, drafts, forum_posts, post_views, forum_comments')
console.log(`4. Auth → URL Configuration: Site URL = ${displaySiteUrl}`)
console.log(`5. Redirect URLs include ${displaySiteUrl}/**`)
console.log('6. Enable Google under Authentication → Providers')
console.log('7. Set the same VITE_* vars in Vercel and redeploy\n')

process.exit(ok ? 0 : 1)
