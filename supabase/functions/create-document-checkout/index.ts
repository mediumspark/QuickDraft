import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/supabase.ts'

const DOCUMENT_PRICE_CENTS = 500 // $5 per document action

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentId, action, successPath, cancelPath, productLabel } = await req.json()

    if (!documentId || !['download', 'share'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const user = await getAuthenticatedUser(req)

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const origin = req.headers.get('origin') ?? Deno.env.get('SITE_URL') ?? ''
    const defaultSuccess = successPath || '/builder'
    const defaultCancel = cancelPath || '/builder'
    const actionLabel = productLabel
      || (action === 'download' ? 'PDF Download' : 'Share Link')

    const metadata: Record<string, string> = {
      document_id: documentId,
      action,
    }

    if (user?.id) {
      metadata.user_id = user.id
    }

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
            unit_amount: DOCUMENT_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${origin}${defaultSuccess}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${defaultCancel}?payment=cancelled`,
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
