# QuickDraft

A legal agreement builder for revenue sharing, profit sharing, commission-based deals, and NDAs.

## Stack

- React 18 + Vite
- Tailwind CSS + shadcn/ui-style components
- React Router DOM
- Framer Motion
- jsPDF
- LocalStorage for drafts, versions, audit log, and notes
- Supabase Auth + Database for user accounts and credit ledger
- Stripe Checkout for payments ($5/credit)
- Supabase Edge Functions for secure payment processing
- Resend for email notifications (optional)

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (frontend) |
| `VITE_RESEND_API_KEY` | Resend API key for emails |

Edge Function secrets (set via Supabase CLI, never in `.env`):

| Secret | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

Without Supabase configured, drafting works locally but payment gating is disabled.

## Supabase Setup

1. Create a Supabase project and enable **Email** auth provider
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor
3. Install the [Supabase CLI](https://supabase.com/docs/guides/cli)
4. Link your project: `supabase link --project-ref YOUR_REF`
5. Set secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
6. Deploy Edge Functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   supabase functions deploy consume-credit
   ```
7. In Stripe Dashboard, add a webhook endpoint:
   - URL: `https://YOUR_REF.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`

### Local webhook testing

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
supabase functions serve
```

## Payment Model

- **1 credit = $5** (purchase 1, 5, or 10 credits)
- **1 credit unlocks PDF download** for a given agreement (re-downloads are free)
- **1 credit unlocks share link** for a given agreement (re-copying is free)
- Drafting, preview, templates, and version history are free
- Recipients viewing shared links do not pay

## Features

- **Landing page** — hero, features, agreement types, pricing
- **Auth** — email/password signup and login via Supabase Auth
- **Agreement builder** — modular clause components with live preview
- **PDF export** — paginated letter-size PDF with signature page
- **Stripe Checkout** — secure credit purchases
- **Credit ledger** — server-side balance and usage tracking
- **Templates** — 8 pre-built templates across all agreement types
- **Version history** — up to 10 named snapshots in localStorage
- **Audit log** — tracks edits, downloads, payments, and credit usage
- **Share links** — read-only `/view/:id?token=...` pages
- **Email notifications** — auto-send on sign + manual summary modal

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build
