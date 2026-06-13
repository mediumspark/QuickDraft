import * as React from 'react'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { claimSessionDrafts } from '@/services/supabase'
import { getOrCreateSessionId } from '@/utils/agreementUtils'

const AuthContext = React.createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (nextUser) {
        await claimSessionDrafts(getOrCreateSessionId(), nextUser.id)
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
        redirectTo: `${window.location.origin}${path}`,
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
