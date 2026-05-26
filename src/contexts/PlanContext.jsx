import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'
import { useUserSettings } from '../hooks/useUserSettings'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const PlanContext = createContext({ isPro: false, plan: 'free' })

export function PlanProvider({ children }) {
  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const isAdmin = user?.email === ADMIN_EMAIL
  const plan = isAdmin ? 'pro' : (settings?.plan || 'free')
  const isPro = isAdmin || plan === 'pro'

  return (
    <PlanContext.Provider value={{ isPro, plan }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  return useContext(PlanContext)
}
