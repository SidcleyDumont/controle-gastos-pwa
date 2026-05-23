import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

// Detecta recovery ANTES do Supabase limpar o hash da URL
const _initialHashParams = new URLSearchParams(window.location.hash.substring(1))
const _isRecoveryFlow = _initialHashParams.get('type') === 'recovery'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsPasswordUpdate, setNeedsPasswordUpdate] = useState(_isRecoveryFlow)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordUpdate(true)
      } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setNeedsPasswordUpdate(false)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const redirectTo = `${window.location.origin}/login`
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signUp = (email, password) => supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
  const signOut = () => supabase.auth.signOut()
  const resetPassword = (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo })
  const resendConfirmation = (email) => supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } })
  const updatePassword = (newPassword) => supabase.auth.updateUser({ password: newPassword })

  return (
    <AuthContext.Provider value={{ user, loading, needsPasswordUpdate, setNeedsPasswordUpdate, signIn, signUp, signOut, resetPassword, resendConfirmation, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
