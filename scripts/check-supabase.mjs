#!/usr/bin/env node
/**
 * Validates Supabase env vars and tests auth/API connectivity.
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

console.log('QuickDraft Supabase configuration check\n')

if (!env) {
  console.log('✗ No .env file found')
  console.log('\nRun: cp .env.example .env')
  console.log('Then add your Supabase URL and anon key from:')
  console.log('https://supabase.com/dashboard/project/_/settings/api\n')
  process.exit(1)
}

const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY
let ok = true

function check(label, pass, hint) {
  const icon = pass ? '✓' : '✗'
  console.log(`${icon} ${label}`)
  if (!pass && hint) console.log(`  → ${hint}`)
  if (!pass) ok = false
}

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

console.log('\nNext steps:')
console.log('1. Run supabase/schema.sql in your Supabase SQL Editor')
console.log('2. Set Site URL to http://localhost:5173 in Authentication → URL Configuration')
console.log('3. Add http://localhost:5173/** to Redirect URLs')
console.log('4. Enable Google in Authentication → Providers → Google')
console.log('5. In Google Cloud Console, add redirect URI: https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback')
console.log('6. Restart dev server: npm run dev\n')

process.exit(ok ? 0 : 1)
