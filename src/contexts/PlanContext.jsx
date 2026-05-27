import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'
import { useUserSettings } from '../hooks/useUserSettings'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const PlanContext = createContext({ isPro: false, isTrial: false, trialDaysLeft: null, hasProAccess: false, plan: 'free', daysUntilExpiry: null, isExpired: false, settingsLoading: true })

export function PlanProvider({ children }) {
  const { user } = useAuth()
  const { data: settings, isLoading: settingsLoading } = useUserSettings(user?.id)
  const isAdmin = user?.email === ADMIN_EMAIL

  const now = new Date()

  const expiresAt = settings?.plan_expires_at ? new Date(settings.plan_expires_at) : null
  const isExpired = expiresAt ? now > expiresAt : false
  const daysUntilExpiry = expiresAt && !isExpired
    ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
    : null

  const plan = isAdmin ? 'pro' : (settings?.plan || 'free')
  const isPro = isAdmin || (plan === 'pro' && !isExpired)

  const trialExpiresAt = settings?.trial_expires_at ? new Date(settings.trial_expires_at) : null
  const isTrial = !isPro && trialExpiresAt ? now < trialExpiresAt : false
  const trialDaysLeft = isTrial
    ? Math.ceil((trialExpiresAt - now) / (1000 * 60 * 60 * 24))
    : null

  const hasProAccess = isPro || isTrial

  return (
    <PlanContext.Provider value={{ isPro, isTrial, trialDaysLeft, hasProAccess, plan, daysUntilExpiry, isExpired, settingsLoading }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  return useContext(PlanContext)
}
