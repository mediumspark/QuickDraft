import * as React from 'react'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { getAuthRedirectUrl } from '@/utils/siteUrl'

const AuthContext = React.createContext(null)

async function ensureProfile(user) {
  if (!supabase || !user) return
  const displayName =
    user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split('@')[0]
    || 'Writer'
  await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      display_name: displayName,
    },
    { onConflict: 'id' }
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const next = session?.user ?? null
      if (next) await ensureProfile(next)
      setUser(next)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null
      setUser(next)
      if (next) {
        void ensureProfile(next)
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
  }

  const value = {
    user,
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
