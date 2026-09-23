import * as React from 'react'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { getAuthRedirectUrl } from '@/utils/siteUrl'

const AuthContext = React.createContext(null)

async function ensureProfile(user) {
  if (!supabase || !user) return null
  const displayName =
    user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split('@')[0]
    || 'Writer'

  // Prefer update-then-insert so missing optional columns / triggers don't break sign-in
  const { data: existing, error: readErr } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing && !readErr) {
    const { error: insertErr } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      display_name: displayName,
    })
    if (insertErr) {
      console.warn('profile insert failed', insertErr)
      // Fall through — row may already exist from trigger
    }
  } else if (existing) {
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        email: user.email,
        display_name: existing.display_name || displayName,
      })
      .eq('id', user.id)
    if (updateErr) console.warn('profile update failed', updateErr)
  } else if (readErr) {
    console.warn('profile read failed', readErr)
    // Last resort upsert with minimal fields
    const { error: upsertErr } = await supabase.from('profiles').upsert(
      { id: user.id, email: user.email, display_name: displayName },
      { onConflict: 'id' }
    )
    if (upsertErr) console.warn('profile upsert failed', upsertErr)
  }

  // Load admin flag if column exists; never block auth on schema drift
  const withAdmin = await supabase
    .from('profiles')
    .select('id, email, display_name, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!withAdmin.error && withAdmin.data) return withAdmin.data

  const basic = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .eq('id', user.id)
    .maybeSingle()

  return basic.data ? { ...basic.data, is_admin: false } : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null)
  const [profile, setProfile] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const next = session?.user ?? null
      if (next) {
        const p = await ensureProfile(next)
        setProfile(p)
      } else {
        setProfile(null)
      }
      setUser(next)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null
      setUser(next)
      if (next) {
        void ensureProfile(next).then(setProfile)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async (redirectPath) => {
    if (!supabase) throw new Error('Sign in requires Supabase to be configured')

    const path = redirectPath || window.location.pathname || '/'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(path),
      },
    })

    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }

  const value = {
    user,
    profile,
    isAdmin: !!profile?.is_admin,
    loading,
    signInWithGoogle,
    signOut,
    isAuthConfigured: isSupabaseConfigured(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
