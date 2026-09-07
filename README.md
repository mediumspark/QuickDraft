# AQuickDraft

A quiet writing space for amateur writers — timed sessions, cloud drafts, honest AI labels, and a peer feedback forum.

## Features

- **Writing room** (`/write`) — fullscreen editor, timer, prompts, word goals
- **AI labels** — AI Free, AI Contributed, or AI Generated (controls sharing & comments)
- **Drafts** — save to Supabase when signed in (Google auth)
- **Forum** — share AI Free / AI Contributed work; YouTube-style views; Docs-style comments
- **Feedback visibility** — author chooses: only me / account holders / public

## Stack

- Vite + React + Tailwind
- Supabase (auth + Postgres + RLS)
- Vercel (hosting + Web Analytics)

## Setup

1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor
3. Enable Google provider in Supabase Auth; add redirect URLs for your site
4. `npm install && npm run dev`

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run check:supabase` — validate Supabase env/connectivity
