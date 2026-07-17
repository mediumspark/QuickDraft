import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/supabase.ts'

const CREDIT_PRICE_CENTS = 99 // $0.99 per credit
const ALLOWED_CREDIT_PACKS = [1, 5, 10]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { credits = 1 } = await req.json()
    if (!ALLOWED_CREDIT_PACKS.includes(credits)) {
      return new Response(JSON.stringify({ error: 'Invalid credit pack' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const origin = req.headers.get('origin') ?? Deno.env.get('SITE_URL') ?? ''

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AQuickDraft Credits (${credits})`,
              description: `${credits} credit${credits > 1 ? 's' : ''} for PDF download or share link`,
            },
            unit_amount: CREDIT_PRICE_CENTS,
          },
          quantity: credits,
        },
      ],
      metadata: {
        user_id: user.id,
        credits: String(credits),
      },
      success_url: `${origin}/builder?payment=success`,
      cancel_url: `${origin}/builder?payment=cancelled`,
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
