import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/supabase.ts'

const DOCUMENT_PRICE_CENTS = 500 // $5 per builder document action
const BOILERPLATE_LIST_PRICE_CENTS = 15000 // $150
const BOILERPLATE_SALE_PRICE_CENTS = 500 // $5 launch sale
const BOILERPLATE_SALE_END = '2026-07-21T23:59:59'

function getBoilerplateCheckoutCents() {
  return new Date() <= new Date(BOILERPLATE_SALE_END)
    ? BOILERPLATE_SALE_PRICE_CENTS
    : BOILERPLATE_LIST_PRICE_CENTS
}

function resolveUnitAmount(documentId: string) {
  if (documentId.startsWith('boilerplate:')) {
    return getBoilerplateCheckoutCents()
  }
  return DOCUMENT_PRICE_CENTS
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentId, action, successPath, cancelPath, productLabel } = await req.json()

    if (!documentId || !['edit', 'download', 'share'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const user = await getAuthenticatedUser(req)

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const origin = (Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://www.aquickdraft.com').replace(/\/$/, '')
    const defaultSuccess = successPath || '/payment/success'
    const defaultCancel = cancelPath || '/payment/cancelled'
    const actionLabel = productLabel
      || (action === 'download' ? 'PDF Download' : action === 'share' ? 'Share Link' : 'Edit Unlock')

    const metadata: Record<string, string> = {
      document_id: documentId,
      action,
    }

    if (user?.id) {
      metadata.user_id = user.id
    }

    const unitAmount = resolveUnitAmount(documentId)

    const successQuery = defaultSuccess.includes('?') ? '&' : '?'
    const cancelQuery = defaultCancel.includes('?') ? '&' : '?'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AQuickDraft — ${actionLabel}`,
              description: productLabel
                ? `Boilerplate Word document: ${actionLabel}`
                : `Pay-per-document: ${actionLabel} for one agreement`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${origin}${defaultSuccess}${successQuery}payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${defaultCancel}${cancelQuery}payment=cancelled`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
