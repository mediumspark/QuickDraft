# QuickDraft

A legal agreement builder for revenue sharing, profit sharing, commission-based deals, and NDAs.

## Stack

- React 18 + Vite
- Tailwind CSS + shadcn/ui-style components
- Stripe Checkout — pay-per-document ($5), no accounts
- Supabase Edge Functions + optional cloud storage for share links
- LocalStorage for drafts, versions, audit log, and payment unlocks

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

Edge Function secrets (via `supabase secrets set`):

| Secret | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

## Payment Model

- **No accounts or credit balances**
- **$5 to download** a PDF for one agreement
- **$5 to share** a read-only link for one agreement
- Re-download / re-copy on the same device is free after payment
- Drafting and preview are always free

## Supabase Setup

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor
2. Deploy Edge Functions:
   ```bash
   supabase functions deploy create-document-checkout --no-verify-jwt
   supabase functions deploy verify-document-payment --no-verify-jwt
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
3. Set secrets and configure Stripe webhook → `/functions/v1/stripe-webhook`

Without Supabase configured, drafting works locally and payment gating is disabled.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build
