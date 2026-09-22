import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!stripe || !supabaseAdmin || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Webhook not configured' })
  }

  let event
  try {
    const buf = await readRawBody(req)
    const sig = req.headers['stripe-signature']
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('stripe webhook signature', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.user_id || session.client_reference_id
      const awardId = session.metadata?.award_id
      const quantity = Math.max(1, Number(session.metadata?.quantity) || 1)

      if (userId && awardId) {
        const { error } = await supabaseAdmin.rpc('credit_award_purchase', {
          p_user_id: userId,
          p_award_id: awardId,
          p_quantity: quantity,
          p_stripe_session_id: session.id,
          p_stripe_payment_intent:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id || null,
          p_amount_cents: session.amount_total ?? null,
        })
        if (error) {
          console.error('credit_award_purchase', error)
          return res.status(500).json({ error: error.message })
        }
      }
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('stripe webhook', err)
    return res.status(500).json({ error: err.message || 'Webhook failed' })
  }
}
