import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createServiceClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
  })

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const documentId = session.metadata?.document_id
      const action = session.metadata?.action

      if (!documentId || !action || !session.id) {
        return new Response('Missing metadata', { status: 400 })
      }

      const supabase = createServiceClient()

      const { data: existing } = await supabase
        .from('document_payments')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (existing) {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      await supabase.from('document_payments').insert({
        document_id: documentId,
        action,
        stripe_session_id: session.id,
        amount_cents: session.amount_total ?? 500,
        status: 'completed',
      })
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
