# AQuickDraft

Agreement templates for game developers, technical folks, and college students. Revenue sharing, profit sharing, commission deals, and NDAs — $5 per document.

## Stack

- React 18 + Vite
- Tailwind CSS + shadcn/ui-style components
- Stripe Checkout — pay-per-document ($5), no accounts
- Supabase Edge Functions + optional cloud storage for share links
- LocalStorage for drafts, versions, audit log, and payment unlocks

## Getting Started

```bash
npm install
cp .env.example .env   # then add your Supabase + Stripe keys
npm run check:supabase # verify Supabase auth is configured
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SITE_URL` | Production app URL (e.g. `https://www.aquickdraft.com`) — used for Google OAuth redirects |
| `VITE_SUPABASE_URL` | Supabase project URL (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon **public** key (Settings → API) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

Edge Function secrets (via `supabase secrets set`):

| Secret | Description |
|---|---|
| `SITE_URL` | Production app URL (same as `VITE_SITE_URL`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

## Supabase Auth Setup (Google Sign-In)

1. **Create a project** at [supabase.com/dashboard](https://supabase.com/dashboard)

2. **Copy API keys** from **Project Settings → API**:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

3. **Add to `.env`** in the project root:
   ```
   VITE_SITE_URL=https://www.aquickdraft.com
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Run the database schema** — paste [`supabase/schema.sql`](supabase/schema.sql) into the **SQL Editor** and run it.

5. **Configure Auth URLs** in **Authentication → URL Configuration**:
   - **Site URL:** `https://www.aquickdraft.com` (your production URL)
   - **Redirect URLs:** `https://www.aquickdraft.com/**`

6. **Set up Google OAuth** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Create an **OAuth 2.0 Client ID** (Web application)
   - **Authorized JavaScript origins:** `https://www.aquickdraft.com`
   - **Authorized redirect URI:** `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

7. **Enable Google** in Supabase **Authentication → Providers → Google**:
   - Paste the Google **Client ID** and **Client Secret**
   - Save

8. **Set the edge function site URL:**
   ```bash
   supabase secrets set SITE_URL=https://www.aquickdraft.com
   ```

9. **Verify setup:**
   ```bash
   npm run check:supabase
   npm run dev
   ```

9. Open your production site and click **Continue with Google** to sign in.

## Payment Model

- **No accounts or credit balances**
- **$5 to download** a PDF for one agreement
- **$5 to share** a read-only link for one agreement
- Re-download / re-copy on the same device is free after payment
- Drafting and preview are always free

## Supabase Setup (Payments + Share Links)

1. Complete **Supabase Auth Setup** above first
2. Link your project and deploy Edge Functions:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy create-document-checkout --no-verify-jwt
   supabase functions deploy verify-document-payment --no-verify-jwt
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
3. Set secrets and configure Stripe webhook → `/functions/v1/stripe-webhook`

Without Supabase configured, drafting works locally and payment gating is disabled.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run build:seo` — production build + sitemap + prerender for SEO
- `npm run preview` — preview production build
- `npm run check:supabase` — validate Supabase auth configuration

See [docs/SEO_DEPLOY.md](docs/SEO_DEPLOY.md) for post-deploy SEO verification.
