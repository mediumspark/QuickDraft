import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders } from '../_shared/cors.ts'
import { createServiceClient, getAuthenticatedUser } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing session ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ paid: false, error: 'Payment not completed' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const documentId = session.metadata?.document_id
    const action = session.metadata?.action
    const metadataUserId = session.metadata?.user_id

    if (!documentId || !action) {
      return new Response(JSON.stringify({ error: 'Invalid session metadata' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authUser = await getAuthenticatedUser(req)
    const userId = metadataUserId || authUser?.id || null

    const supabase = createServiceClient()

    const { data: existing } = await supabase
      .from('document_payments')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()

    if (!existing) {
      await supabase.from('document_payments').insert({
        document_id: documentId,
        action,
        user_id: userId,
        stripe_session_id: session.id,
        amount_cents: session.amount_total ?? 99,
        status: 'completed',
      })
    }

    return new Response(
      JSON.stringify({ paid: true, documentId, action }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
