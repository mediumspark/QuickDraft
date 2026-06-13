import { corsHeaders } from '../_shared/cors.ts'
import { createServiceClient, getAuthenticatedUser } from '../_shared/supabase.ts'

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

    const { agreementId, action } = await req.json()

    if (!agreementId || !['download', 'share'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createServiceClient()

    // Check if already unlocked (idempotent re-use)
    const { data: existingUsage } = await supabase
      .from('credit_usage')
      .select('id')
      .eq('user_id', user.id)
      .eq('agreement_id', agreementId)
      .eq('action', action)
      .maybeSingle()

    if (existingUsage) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      return new Response(
        JSON.stringify({ unlocked: true, alreadyUnlocked: true, remainingCredits: profile?.credits ?? 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check credit balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (profile.credits < 1) {
      return new Response(
        JSON.stringify({ unlocked: false, credits: profile.credits }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decrement credits and record usage atomically
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: profile.credits - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .eq('credits', profile.credits) // optimistic lock

    if (updateError) {
      throw updateError
    }

    const { error: usageError } = await supabase.from('credit_usage').insert({
      user_id: user.id,
      agreement_id: agreementId,
      action,
    })

    if (usageError) {
      // Rollback credit on failure
      await supabase
        .from('profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id)
      throw usageError
    }

    return new Response(
      JSON.stringify({ unlocked: true, remainingCredits: profile.credits - 1 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
