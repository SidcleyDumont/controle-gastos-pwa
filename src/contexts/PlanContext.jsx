import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'
import { useUserSettings } from '../hooks/useUserSettings'

const PlanContext = createContext({ isPro: false, plan: 'free' })

export function PlanProvider({ children }) {
  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const plan = settings?.plan || 'free'
  const isPro = plan === 'pro'

  return (
    <PlanContext.Provider value={{ isPro, plan }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  return useContext(PlanContext)
}
