import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signUp = async (email, password) => {
    const normalizedEmail = email.toLowerCase().trim()

    // Verifica duplicidade antes do signup — Supabase não retorna erro para e-mail duplicado
    // quando confirmação de e-mail está habilitada (comportamento intencional do Supabase)
    const { data: emailExists, error: checkError } = await supabase.rpc('check_email_exists', {
      check_email: normalizedEmail,
    })
    if (checkError) console.warn('check_email_exists error:', checkError.message)
    if (emailExists) {
      return {
        data: null,
        error: { message: 'User already registered' },
      }
    }

    const result = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { emailRedirectTo: `${appUrl}/login` },
    })

    // Dispara e-mail de boas-vindas (fire-and-forget — não bloqueia o cadastro)
    if (!result.error && result.data?.user) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}` },
      }).catch(() => {})
    }
    return result
  }
  const signOut = () => supabase.auth.signOut()
  const resetPassword = (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl}/reset-password` })
  const resendConfirmation = (email) => supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${appUrl}/login` } })

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword, resendConfirmation }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
