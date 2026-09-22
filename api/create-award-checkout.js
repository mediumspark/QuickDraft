import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const supabaseAdmin = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

function siteUrl(req) {
  const env = process.env.VITE_SITE_URL || process.env.SITE_URL
  if (env) return env.replace(/\/$/, '')
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!stripe || !supabaseAdmin) {
    return res.status(503).json({
      error: 'Stripe or Supabase service is not configured. Set STRIPE_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY.',
    })
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Sign in required' })

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid session' })
    }
    const user = userData.user

    const { awardId, quantity = 1 } = req.body || {}
    const qty = Math.max(1, Math.min(20, Number(quantity) || 1))
    if (!awardId) return res.status(400).json({ error: 'awardId required' })

    const { data: award, error: awardError } = await supabaseAdmin
      .from('awards')
      .select('*')
      .eq('id', awardId)
      .eq('active', true)
      .maybeSingle()

    if (awardError || !award) {
      return res.status(404).json({ error: 'Award not found' })
    }

    const priceId =
      award.stripe_price_id
      || process.env[`STRIPE_PRICE_${String(award.slug).toUpperCase().replace(/-/g, '_')}`]
      || null

    if (!priceId) {
      return res.status(400).json({
        error: `No Stripe price configured for “${award.name}”. Set awards.stripe_price_id or STRIPE_PRICE_${String(award.slug).toUpperCase().replace(/-/g, '_')}.`,
      })
    }

    const base = siteUrl(req)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: qty }],
      success_url: `${base}/account?award=success`,
      cancel_url: `${base}/account?award=cancel`,
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      metadata: {
        user_id: user.id,
        award_id: award.id,
        quantity: String(qty),
      },
    })

    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('create-award-checkout', err)
    return res.status(500).json({ error: err.message || 'Checkout failed' })
  }
}
