# AQuickDraft

A quiet writing space for amateur writers — timed sessions, cloud drafts, honest AI labels, and a peer feedback forum.

## Features

- **Writing room** (`/write`) — fullscreen editor, timer, prompts, word goals, rich text
- **AI labels** — AI Free, AI Contributed, or AI Generated (controls sharing & comments)
- **Drafts** — save to Supabase when signed in (Google auth)
- **Forum** — share AI Free / AI Contributed work; YouTube-style views; Docs-style comments
- **Feedback visibility** — author chooses: only me / account holders / public

## Stack

- Vite + React + Tailwind
- Supabase (auth + Postgres + RLS)
- Vercel (hosting + Web Analytics)

## Setup

### 1. App env

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL`

Use the same values in Vercel → Project → Settings → Environment Variables.

### 2. Database (required for drafts + forum)

The error `Could not find the table 'public.drafts' in the schema cache` means this step has not been run on your project yet.

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Paste the **entire** contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Click **Run**
4. In **Table Editor**, confirm these tables exist:
   - `profiles`
   - `drafts`
   - `forum_posts`
   - `post_views`
   - `forum_comments`
   - `prompt_of_the_day`
5. Make yourself admin (after you’ve signed in once):

```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'you@example.com';
```

6. Optionally run `npm run check:supabase` to verify tables + `record_post_view` RPC

If you already applied an older schema, run [`supabase/prompt_of_the_day.sql`](supabase/prompt_of_the_day.sql) for the homepage prompt feature.

The schema is idempotent (safe to re-run). It also reloads the PostgREST schema cache.

### 3. Auth

1. Authentication → Providers → enable **Google**
2. Authentication → URL Configuration:
   - Site URL = your production URL (e.g. `https://www.aquickdraft.com`)
   - Redirect URLs include `https://www.aquickdraft.com/**`
3. In Google Cloud Console, add the Supabase callback:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### 4. Run locally

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run check:supabase` — validate env, Google auth, and writing tables
