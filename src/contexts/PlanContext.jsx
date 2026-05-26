import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'
import { useUserSettings } from '../hooks/useUserSettings'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const PlanContext = createContext({ isPro: false, plan: 'free', daysUntilExpiry: null, isExpired: false })

export function PlanProvider({ children }) {
  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const isAdmin = user?.email === ADMIN_EMAIL

  const expiresAt = settings?.plan_expires_at ? new Date(settings.plan_expires_at) : null
  const now = new Date()
  const isExpired = expiresAt ? now > expiresAt : false
  const daysUntilExpiry = expiresAt && !isExpired
    ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
    : null

  const plan = isAdmin ? 'pro' : (settings?.plan || 'free')
  const isPro = isAdmin || (plan === 'pro' && !isExpired)

  return (
    <PlanContext.Provider value={{ isPro, plan, daysUntilExpiry, isExpired }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  return useContext(PlanContext)
}
